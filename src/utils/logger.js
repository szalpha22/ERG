const { createEmbed, COLORS } = require('./embeds');

async function logToChannel(client, channelId, embed) {
  if (!channelId) return;
  
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel && channel.isTextBased()) {
      await channel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error(`Failed to log to channel ${channelId}:`, error.message);
  }
}

async function logCampaign(client, action, campaign, admin) {
  const channelId = process.env.CAMPAIGN_LOGS_CHANNEL;
  const embed = createEmbed({
    title: `📹 Campaign ${action}`,
    fields: [
      { name: 'Campaign', value: campaign.name, inline: true },
      { name: 'Admin', value: `<@${admin.id}>`, inline: true },
      { name: 'Action', value: action, inline: true }
    ],
    color: COLORS.INFO
  });
  await logToChannel(client, channelId, embed);
}

async function logSubmission(client, action, submission, user) {
  const channelId = process.env.SUBMISSION_LOGS_CHANNEL;
  const embed = createEmbed({
    title: `📤 Submission ${action}`,
    fields: [
      { name: 'Clip ID', value: `#${submission.id}`, inline: true },
      { name: 'User', value: `<@${user.id}>`, inline: true },
      { name: 'Platform', value: submission.platform, inline: true },
      { name: 'Link', value: submission.video_link, inline: false },
      { name: 'Views', value: submission.views ? submission.views.toLocaleString() : '0', inline: true },
      { name: 'Status', value: submission.status, inline: true },
      { name: 'Campaign ID', value: `#${submission.campaign_id}`, inline: true }
    ],
    color: COLORS.INFO
  });
  await logToChannel(client, channelId, embed);
}

async function logFlagged(client, submission, reason, admin) {
  const channelId = process.env.FLAGGED_CLIPS_CHANNEL;
  const embed = createEmbed({
    title: `🚩 Clip Flagged`,
    fields: [
      { name: 'User', value: `<@${submission.user_id}>`, inline: true },
      { name: 'Link', value: submission.video_link, inline: false },
      { name: 'Reason', value: reason, inline: false },
      { name: 'Flagged By', value: admin ? `<@${admin.id}>` : 'System', inline: true }
    ],
    color: COLORS.WARNING
  });
  await logToChannel(client, channelId, embed);
}

async function logPayout(client, action, payout, user) {
  const channelId = process.env.PAYOUT_LOGS_CHANNEL;
  const embed = createEmbed({
    title: `💰 Payout ${action}`,
    fields: [
      { name: 'Payout ID', value: `#${payout.id}`, inline: true },
      { name: 'User', value: `<@${user.id}>`, inline: true },
      { name: 'Amount', value: `$${payout.amount.toFixed(2)}`, inline: true },
      { name: 'Campaign ID', value: `#${payout.campaign_id}`, inline: true },
      { name: 'Status', value: payout.status, inline: true },
      { name: 'Ticket ID', value: payout.ticket_id ? `#${payout.ticket_id}` : 'N/A', inline: true }
    ],
    color: payout.status === 'approved' ? COLORS.SUCCESS : payout.status === 'rejected' ? COLORS.ERROR : COLORS.WARNING
  });
  await logToChannel(client, channelId, embed);
}

async function logTicket(client, action, ticket, user) {
  const channelId = process.env.TICKET_LOGS_CHANNEL;
  const embed = createEmbed({
    title: `🎟️ Ticket ${action}`,
    fields: [
      { name: 'User', value: `<@${user.id}>`, inline: true },
      { name: 'Type', value: ticket.type, inline: true },
      { name: 'Ticket ID', value: `#${ticket.id}`, inline: true },
      { name: 'Status', value: ticket.status, inline: true }
    ],
    color: COLORS.INFO
  });
  await logToChannel(client, channelId, embed);
}

async function logInvite(client, action, user, inviter = null, isFake = false) {
  const channelId = process.env.INVITE_LOGS_CHANNEL;
  const fields = [
    { name: 'User', value: `<@${user.id}>`, inline: true },
    { name: 'Action', value: action, inline: true }
  ];
  
  if (inviter) {
    fields.push({ name: 'Invited By', value: `<@${inviter}>`, inline: true });
  }

  if (isFake && action === 'Joined') {
    fields.push({ name: 'Status', value: '⚠️ Possible Fake Invite', inline: true });
  }

  const embed = createEmbed({
    title: `📨 Member ${action}`,
    fields,
    color: action === 'Joined' ? COLORS.SUCCESS : COLORS.ERROR
  });
  await logToChannel(client, channelId, embed);
}

async function logModeration(client, action, user, moderator, reason = null, duration = null) {
  const channelId = process.env.MODERATION_LOGS_CHANNEL;
  const fields = [
    { name: 'User', value: `<@${user.id}>`, inline: true },
    { name: 'Moderator', value: `<@${moderator.id}>`, inline: true },
    { name: 'Action', value: action, inline: true }
  ];

  if (reason) {
    fields.push({ name: 'Reason', value: reason, inline: false });
  }

  if (duration) {
    fields.push({ name: 'Duration', value: duration, inline: true });
  }

  const embed = createEmbed({
    title: `🛡️ Moderation Action`,
    fields,
    color: COLORS.WARNING
  });
  await logToChannel(client, channelId, embed);
}

async function logCommand(client, interaction) {
  const channelId = process.env.COMMAND_LOGS_CHANNEL;
  const embed = createEmbed({
    title: `⌨️ Command Executed`,
    fields: [
      { name: 'User', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Command', value: `/${interaction.commandName}`, inline: true },
      { name: 'Channel', value: `<#${interaction.channelId}>`, inline: true }
    ],
    color: COLORS.INFO
  });
  await logToChannel(client, channelId, embed);
}

async function logError(client, error, context = '') {
  const channelId = process.env.ERROR_LOGS_CHANNEL;
  const embed = createEmbed({
    title: `🔥 Error Occurred`,
    description: `\`\`\`${error.message}\`\`\``,
    fields: [
      { name: 'Context', value: context || 'Unknown', inline: true },
      { name: 'Stack', value: `\`\`\`${error.stack?.substring(0, 1000) || 'No stack trace'}\`\`\``, inline: false }
    ],
    color: COLORS.ERROR
  });
  await logToChannel(client, channelId, embed);
  console.error(`Error [${context}]:`, error);
}

module.exports = {
  logCampaign,
  logSubmission,
  logFlagged,
  logPayout,
  logTicket,
  logInvite,
  logModeration,
  logCommand,
  logError
};
