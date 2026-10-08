import { PrismaService } from "src/prisma.service";

const prisma = new PrismaService();

async function main() {

    //generate default admin user
    await prisma.user.create({
        data : {
            name : "Admin",
            email : "admin@gmail.com",
            auth : {
                create : {
                    password : "$2b$12$r/Yridfc5rDxA/XC4U96Lu59vEkAKM6h6Ef7v5Va1xKZAJLttbS5y",
                    email : "admin@gmail.com",
                    isVerified : true,
                    role : "ADMIN"
                }
            }
        }
    })
    
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });