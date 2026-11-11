import { PrismaService } from "src/prisma.service";

const prisma = new PrismaService();

async function main() {

    await prisma.orderItem.deleteMany();

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