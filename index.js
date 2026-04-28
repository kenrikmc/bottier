const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot Tier Online!'));
app.listen(process.env.PORT || 3000);

const { 
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, 
    ChannelType, EmbedBuilder 
} = require('discord.js');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

// --- CẤU HÌNH ---
const TOKEN = 'MTQ5ODY2ODE4NzUwNjU3NzQ0OA.Gw60PV.9mUGR37g1kxa1t0bbvUYEZg-yLZOO619HfIMn0'; 
const LOG_CHANNEL_ID = '1498672302794211510';
const ALLOWED_ROLE_IDS = [
    '1498649277310828686', '1498648792080187464', '1497968216360620072',
    '1498653620097257543', '1498653742398967871', '1498653842512806020',
    '1498653994363650129', '1498654113515307028','1484598645042184382'
];

client.once('ready', () => console.log('✅ Bot xịn đã treo trên Render!'));

client.on('messageCreate', async (message) => {
    if (message.content === '!setup') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('open_ticket').setLabel('Mở Ticket Test').setStyle(ButtonStyle.Primary)
        );
        await message.channel.send({ content: 'Nhấn nút để mở ticket:', components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'open_ticket') {
        const ticket = await interaction.guild.channels.create({
            name: `test-${interaction.user.username}`,
            type: ChannelType.GuildText,
            topic: interaction.user.id,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: ['ViewChannel'] },
                { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] },
            ],
        });
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('go_form').setLabel('Nhập kết quả').setStyle(ButtonStyle.Success)
        );
        await ticket.send({ content: `Chào ${interaction.user}, Tester bấm nút nhập kết quả:`, components: [row] });
        await interaction.reply({ content: `Đã mở: ${ticket}`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'go_form') {
        const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
        if (!hasPermission) return interaction.reply({ content: '❌ Bạn không có quyền!', ephemeral: true });

        const modal = new ModalBuilder().setCustomId('modal_result').setTitle('Kết Quả Test');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f_name').setLabel("Ingame").setStyle(TextInputStyle.Short)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f_mode').setLabel("Mode (BuildUHC, Sword...)").setStyle(TextInputStyle.Short)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f_old').setLabel("Tier trước").setStyle(TextInputStyle.Short).setPlaceholder("Ví dụ: Unranked")),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f_tier').setLabel("Tier đạt được").setStyle(TextInputStyle.Short))
        );
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_result') {
        const name = interaction.fields.getTextInputValue('f_name');
        const mode = interaction.fields.getTextInputValue('f_mode');
        const oldTier = interaction.fields.getTextInputValue('f_old');
        const tier = interaction.fields.getTextInputValue('f_tier');
        const targetId = interaction.channel.topic;
        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor(0x9b59b6)
                .setTitle(`Kết Quả Test của *${name}* 🏆`)
                .setThumbnail(interaction.guild.iconURL() || interaction.user.displayAvatarURL())
                .addFields(
                    { name: 'Tester:', value: `${interaction.user}`, inline: false },
                    { name: 'Tên game:', value: name, inline: false },
                    { name: 'Region:', value: 'AS', inline: false },
                    { name: 'Mode:', value: mode, inline: false },
                    { name: 'Tier trước:', value: oldTier, inline: false },
                    { name: 'Tier đạt được:', value: `**${tier}** 📈`, inline: false }
                ).setTimestamp();
            await logChannel.send({ content: `<@${targetId}>`, embeds: [embed] });
        }
        await interaction.reply({ content: '✅ Đã gửi! Ticket đóng sau 5s.' });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
});

client.login(TOKEN);
