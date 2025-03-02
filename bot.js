require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Events
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

// Lista de participantes da Elite
let elite = [];
const eliteResponsavel = 'Moraes';
const eliteSenha = 'elite489';

client.on('ready', () => {
    console.log('Bot está funcionando autenticado e pronto para uso!');
});

// Exibir a Elite com o comando !elite
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content === '!elite') {
    const lista = elite.length
      ? elite.map((user, i) => `${i + 1}. <@${user.id}>`).join('\n')
      : '*Nenhum participante na Elite*';

    await message.reply({
      content: `**ELITE**\n👑 Responsável: ${eliteResponsavel}\n\n**Participantes:**\n${lista}`,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('participarElite')
            .setLabel('Entrar na Elite')
            .setStyle(ButtonStyle.Primary)
        )
      ]
    });
  }
});

// Modal para entrar na Elite
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId === 'participarElite') {
    const modal = new ModalBuilder()
      .setCustomId('modalElite')
      .setTitle('Digite a Senha da Elite');

    const senhaInput = new TextInputBuilder()
      .setCustomId('senhaInput')
      .setLabel('Senha')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(senhaInput));
    await interaction.showModal(modal);
  }
});

// Resposta do modal
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId === 'modalElite') {
    const senha = interaction.fields.getTextInputValue('senhaInput');
    if (senha === eliteSenha) {
      if (!elite.find(u => u.id === interaction.user.id)) {
        elite.push({ id: interaction.user.id });
      }
      await interaction.reply({ content: 'Bem-vindo(a) à Elite!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Senha incorreta!', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);