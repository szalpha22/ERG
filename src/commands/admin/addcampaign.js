const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../../database/init');
const { successEmbed, errorEmbed, campaignEmbed } = require('../../utils/embeds');
const { logCampaign } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addcampaign')
    .setDescription('Create a new campaign')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Campaign name')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Campaign description')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Campaign type')
        .setRequired(true)
        .addChoices(
          { name: 'Clipping', value: 'Clipping' },
          { name: 'Reposting', value: 'Reposting' }
        ))
    .addStringOption(option =>
      option.setName('platforms')
        .setDescription('Allowed platforms (comma-separated: YouTube,TikTok,Instagram)')
        .setRequired(true))
    .addNumberOption(option =>
      option.setName('rate')
        .setDescription('Rate per 1K views in USD')
        .setRequired(true)
        .setMinValue(0.01))
    .addStringOption(option =>
      option.setName('content_source')
        .setDescription('Content source or brand info')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to assign when joining')
        .setRequired(false)),

  async execute(interaction) {
    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description');
    const type = interaction.options.getString('type');
    const platformsStr = interaction.options.getString('platforms');
    const rate = interaction.options.getNumber('rate');
    const contentSource = interaction.options.getString('content_source');
    const role = interaction.options.getRole('role');

    await interaction.deferReply({ ephemeral: true });

    try {
      const platforms = platformsStr.split(',').map(p => p.trim());
      const validPlatforms = ['YouTube', 'TikTok', 'Instagram'];
      
      const invalidPlatforms = platforms.filter(p => !validPlatforms.includes(p));
      if (invalidPlatforms.length > 0) {
        return await interaction.editReply({
          embeds: [errorEmbed('Invalid Platforms', `Invalid platforms: ${invalidPlatforms.join(', ')}\nValid: ${validPlatforms.join(', ')}`)]
        });
      }

      const stmt = db.prepare(`
        INSERT INTO campaigns (name, description, type, platforms, content_source, rate_per_1k, role_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        name,
        description,
        type,
        JSON.stringify(platforms),
        contentSource,
        rate,
        role?.id || null,
        'active'
      );

      const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(result.lastInsertRowid);

      const activeCampaignsChannel = process.env.ACTIVE_CAMPAIGNS_CHANNEL;
      if (activeCampaignsChannel) {
        const channel = await interaction.client.channels.fetch(activeCampaignsChannel);
        
        const embed = campaignEmbed(campaign);
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`campaign_join_${campaign.id}`)
              .setLabel('Join Campaign')
              .setStyle(ButtonStyle.Success)
              .setEmoji('🎬')
          );

        const message = await channel.send({ embeds: [embed], components: [row] });
        
        const updateStmt = db.prepare('UPDATE campaigns SET message_id = ? WHERE id = ?');
        updateStmt.run(message.id, campaign.id);
      }

      await logCampaign(interaction.client, 'Created', campaign, interaction.user);

      await interaction.editReply({
        embeds: [successEmbed('Campaign Created', `Campaign **${name}** has been created successfully!`)]
      });

    } catch (error) {
      console.error('Add campaign error:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', error.message.includes('UNIQUE') ? 'A campaign with this name already exists!' : 'Failed to create campaign.')]
      });
    }
  }
};
