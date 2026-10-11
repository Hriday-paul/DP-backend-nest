import { PrismaService } from "src/prisma.service";

const prisma = new PrismaService();

async function main() {

    //generate default admin user
    await prisma.user.upsert({
        where: {
            email: "admin@gmail.com",
        },
        update: {
            name: "Admin",
            auth: {
                upsert: {
                    update: {
                        password: "$2b$15$eLr1wzpmpBCMxBhRGJfLMe1ZFsmP7jt/PrwbRDxRryH63CQUPf3RK",
                        email: "admin@gmail.com",
                        isVerified: true,
                        role: "ADMIN",
                    },
                    create: {
                        password: "$2b$15$eLr1wzpmpBCMxBhRGJfLMe1ZFsmP7jt/PrwbRDxRryH63CQUPf3RK",
                        email: "admin@gmail.com",
                        isVerified: true,
                        role: "ADMIN",
                    },
                },
            },
        },
        create: {
            name: "Admin",
            email: "admin@gmail.com",
            auth: {
                create: {
                    password: "$2b$15$eLr1wzpmpBCMxBhRGJfLMe1ZFsmP7jt/PrwbRDxRryH63CQUPf3RK",
                    email: "admin@gmail.com",
                    isVerified: true,
                    role: "ADMIN",
                },
            },
        },
    });

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