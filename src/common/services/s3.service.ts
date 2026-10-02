import { Injectable } from "@nestjs/common";
import { config } from "../constant";
import * as fs from 'fs';
import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CreateMultipartUploadCommand,
    PutObjectCommand,
    S3Client,
    UploadPartCommand,
    GetObjectCommand
} from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const PART_SIZE = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class S3Service {

    private readonly s3 = new S3Client({
        region: `${config.aws.region}`,
        credentials: {
            accessKeyId: `${config.aws.accessKeyId}`,
            secretAccessKey: `${config.aws.secretAccessKey}`,
        },
    });

    private readonly bucket = config.aws.bucket;

    async uploadWithProgress(
        localPath: string,
        fileName: string,
        onProgress: (percent: number) => Promise<void>,
    ): Promise<{url : string, key: string}> {
        const fileSize = fs.statSync(localPath).size;
        const key = `uploads/${Date.now()}-${fileName}`;

        if (fileSize <= PART_SIZE) {
            const body = fs.readFileSync(localPath);
            await this.s3.send(new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: body,
                ContentLength: fileSize,
            }));
            await onProgress(100);
            return this.toUrl(key);
        }

        const { UploadId } = await this.s3.send(
            new CreateMultipartUploadCommand({ Bucket: this.bucket, Key: key }),
        );

        const parts: { PartNumber: number; ETag: string }[] = [];
        let uploaded = 0;
        let partNumber = 1;

        try {
            const stream = fs.createReadStream(localPath, { highWaterMark: PART_SIZE });

            for await (const chunk of stream) {
                const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

                const { ETag } = await this.s3.send(new UploadPartCommand({
                    Bucket: this.bucket,
                    Key: key,
                    UploadId,
                    PartNumber: partNumber,
                    Body: buffer,
                    ContentLength: buffer.length, // ✅ explicit length prevents chunked encoding issues
                }));

                parts.push({ PartNumber: partNumber++, ETag: ETag! });
                uploaded += (chunk as Buffer).length;
                await onProgress(Math.round((uploaded / fileSize) * 100));
            }

            await this.s3.send(new CompleteMultipartUploadCommand({
                Bucket: this.bucket,
                Key: key,
                UploadId,
                MultipartUpload: { Parts: parts },
            }));

        } catch (err) {

            console.log("=============uploade error===========", err)

            await this.s3.send(new AbortMultipartUploadCommand({
                Bucket: this.bucket,
                Key: key,
                UploadId,
            })).catch(() => { });
            throw err;
        }

        return this.toUrl(key);
    }

    private toUrl(key: string): {url : string, key: string} {
        return {url : `https://${this.bucket}.s3.${config.aws.region}.amazonaws.com/${key}`, key};
    }

    async getPresignedUrl({ s3key, fileName }: { s3key: string; fileName: string }): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: s3key,
            ResponseContentDisposition: `attachment; filename="${fileName}"`,
        });

        return getSignedUrl(this.s3, command, { expiresIn: 60 }); // seconds
    }
}