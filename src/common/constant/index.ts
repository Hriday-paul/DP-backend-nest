
const redis = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
}

const aws = {
  accessKeyId: process.env.S3_BUCKET_ACCESS_KEY,
  secretAccessKey: process.env.S3_BUCKET_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  bucket: process.env.AWS_BUCKET_NAME,
  spacesEndpoint: process.env.SPACES_ENDPOINT,
};

export const config = {
    serverDomain: process.env.SERVER_DOMAIN,
    nodemailer_host_email: process.env.NODEMAILER_HOST_EMAIL,
    nodemailer_host_pass : process.env.NODEMAILER_HOST_PASS,
    email_port: Number(process.env.EMAIL_PORT),

    accessSecret : process.env.JWT_ACCESS_SECRET,
    authSecret : process.env.JWT_AUTH_SECRET,
    accessExpiresIn : process.env.JWT_ACCESS_EXPIRES_IN,

    refreshSecret : process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn : process.env.JWT_REFRESH_EXPIRES_IN,

    redis,
    aws,
}