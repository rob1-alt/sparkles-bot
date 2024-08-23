const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require("@aws-sdk/client-s3");

// Configuration du client Discord
const bot = new Client({ 
    intents: [GatewayIntentBits.Guilds],
    partials: ['CHANNEL']
});

const BETA_SITE_URL = process.env.BETA_SITE_URL
// Configuration du client AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Configuration S3
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const FOLDER_NAME = process.env.AWS_FOLDER_NAME || "girls/";

console.log("Connexion au bot...");
bot.login(process.env.DISCORD_BOT_TOKEN)
    .then(() => console.log("Initialisation du bot réussie"))
    .catch((error) => console.log("Impossible de se connecter au bot - " + error));

bot.on("ready", async () => {
    await bot.application.commands.set([
        {
            name: "socials",
            description: "Social media links"
        },
        {
            name: "randomize_girl",
            description: "Show a AI girlfriend previously generated"
        },
        {
            name: "beta",
            description: "Join the beta program"
        }
    ]);

    console.log("Sparkles chargé avec succès !");
});

bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    if (!interaction.guild) {
        await interaction.reply({ content: "Commands are only available on servers.", ephemeral: true });
        return;
      }

    switch (interaction.commandName) {
        case "socials":
            await interaction.reply("Our twitter : https://x.com/SparklesAI \n Our website : https://www.sparkles-app.com/");
            break;
        
        case "beta":
            try {
                await interaction.user.send(`Join the Sparkles beta program by registering at ${BETA_SITE_URL}`);
                await interaction.reply("Information on how to join the beta program has been sent to you in a private message.");
            } catch (error) {
                console.error("Erreur lors de l'envoi du message privé:", error);
                await interaction.reply("Impossible de vous envoyer les informations pour rejoindre le programme beta.");
            }


        case "randomize_girl":
            try {
                const listCommand = new ListObjectsV2Command({
                    Bucket: BUCKET_NAME,
                    Prefix: FOLDER_NAME
                });
                const { Contents } = await s3Client.send(listCommand);

                if (!Contents || Contents.length === 0) {
                    await interaction.reply("No images found.");
                    return;
                }

                const randomImage = Contents[Math.floor(Math.random() * Contents.length)];

                const getCommand = new GetObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: randomImage.Key
                });
                const { Body } = await s3Client.send(getCommand);

                const buffer = await streamToBuffer(Body);
                const attachment = new AttachmentBuilder(buffer, { name: "petite.jpg" });

                await interaction.reply({ files: [attachment] });
            } catch (error) {
                console.error("Erreur lors de la récupération de l'image:", error);
                await interaction.reply("Une erreur est survenue lors de la récupération de l'image.");
            }
            break;
    }
});

async function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
}

const express = require('express')
const app = express()
const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

bot.on('messageCreate', async (message) => {
    if (message.channel.type === 'DM' && message.author.id !== bot.user.id) {
      try {
        await message.author.send("Sorry, I can't receive private messages. Please use the commands on the server.");
      } catch (error) {
        console.error("Impossible d'envoyer un message de réponse en DM:", error);
      }
    }
  });