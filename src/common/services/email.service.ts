import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as nodemailer from 'nodemailer';
import { config } from "../constant";

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: config.nodemailer_host_email,
                pass: config.nodemailer_host_pass,
            },
        });
    }

    async sendEmail(options: EmailOptions) {
        const mailOptions = {
            from: config.nodemailer_host_email,
            to: options.to,
            subject: options.subject,
            html: options.html,
        };
        try {
            return await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.log("error in sending email", error);
            throw new InternalServerErrorException('Failed to send email', {
                cause: error,
                description: 'An error occurred while sending the email. Please try again later.'
            });

        }
    }
}