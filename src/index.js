require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const { initializeDatabase } = require('./database/init');
const { logError } = require('./utils/logger');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message]
});

client.commands = new Collection();

function loadCommands() {
  const commandFolders = ['admin', 'user'];
  
  for (const folder of commandFolders) {
    const commandsPath = path.join(__dirname, 'commands', folder);
    if (!fs.existsSync(commandsPath)) continue;
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Loaded command: ${command.data.name}`);
      } else {
        console.warn(`⚠️  Command at ${filePath} is missing required "data" or "execute" property`);
      }
    }
  }
}

function loadEvents() {
  const eventsPath = path.join(__dirname, 'events');
  if (!fs.existsSync(eventsPath)) return;
  
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    
    console.log(`✅ Loaded event: ${event.name}`);
  }
}

client.once('clientReady', async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  console.log(`🌐 Connected to ${client.guilds.cache.size} server(s)`);
  
  client.user.setActivity('Managing ClipHub', { type: 3 });
});

process.on('unhandledRejection', async (error) => {
  console.error('Unhandled promise rejection:', error);
  await logError(client, error, 'Unhandled Rejection');
});

process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  await logError(client, error, 'Uncaught Exception');
});

async function start() {
  try {
    console.log('🚀 Starting ClipHub Bot...');
    
    initializeDatabase();
    loadCommands();
    loadEvents();
    
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

start();

module.exports = client;
