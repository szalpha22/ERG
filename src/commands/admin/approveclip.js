const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../../database/init');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { logSubmission } = require('../../utils/logger');
const { dmSubmissionApproved } = require('../../utils/dmHandler');
const { getYouTubeViews } = require('../../services/youtube');
const { getTikTokViews } = require('../../services/tiktok');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('approveclip')
    .setDescription('Approve a submission')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(option =>
      option.setName('submission_id')
        .setDescription('Submission ID')
        .setRequired(true)),

  async execute(interaction) {
    const submissionId = interaction.options.getInteger('submission_id');

    await interaction.deferReply({ ephemeral: true });

    try {
      const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(submissionId);

      if (!submission) {
        return await interaction.editReply({
          embeds: [errorEmbed('Not Found', 'Submission not found.')]
        });
      }

      let views = submission.views;
      
      if (submission.platform === 'YouTube') {
        const currentViews = await getYouTubeViews(submission.video_link);
        if (currentViews !== null) views = currentViews;
      } else if (submission.platform === 'TikTok') {
        const currentViews = await getTikTokViews(submission.video_link);
        if (currentViews) views = currentViews;
      }

      const stmt = db.prepare(`
        UPDATE submissions 
        SET status = ?, views = ?, reviewed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      stmt.run('approved', views, submissionId);

      const updatedSubmission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(submissionId);
      const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(submission.campaign_id);
      const user = await interaction.client.users.fetch(submission.user_id);

      await dmSubmissionApproved(user, updatedSubmission, campaign, views);
      await logSubmission(interaction.client, 'Approved', updatedSubmission, user);

      await interaction.editReply({
        embeds: [successEmbed('Clip Approved', `Submission #${submissionId} has been approved with ${views.toLocaleString()} views.`)]
      });

    } catch (error) {
      console.error('Approve clip error:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to approve submission.')]
      });
    }
  }
};
