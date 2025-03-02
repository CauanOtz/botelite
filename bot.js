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

// Função para gerar a mensagem da Elite
function getEliteMessage(userId) {
  const lista = elite.length
    ? elite.map((user, i) => `${i + 1}. <@${user.id}>`).join('\n')
    : '*Nenhum participante na Elite*';

  const isMember = elite.find(u => u.id === userId);

  const buttons = [
    new ButtonBuilder()
      .setCustomId('participarElite')
      .setLabel('✅ Entrar na Elite')
      .setStyle(ButtonStyle.Success)
      .setDisabled(isMember),
    new ButtonBuilder()
      .setCustomId('sairElite')
      .setLabel('❌ Sair da Elite')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!isMember)
  ];

  return {
    embeds: [{
      color: 0x0099FF,
      title: '🔱 ELITE TEAM',
      description: `
📅 **Data:** <t:${Math.floor(Date.now() / 1000)}:F>

👑 **Responsável:** ${eliteResponsavel}

👥 **Participantes:**
${lista}

━━━━━━━━━━━━━━━━━━━━━`,
      footer: {
        text: 'Use os botões abaixo para entrar ou sair da Elite!'
      }
    }],
    components: [new ActionRowBuilder().addComponents(buttons)]
  };
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content === '!elite') {
    await message.reply(getEliteMessage(message.author.id));
  }
});

// Resposta do modal
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId === 'modalElite') {
    const senha = interaction.fields.getTextInputValue('senhaInput');
    if (senha === eliteSenha) {
      if (!elite.find(u => u.id === interaction.user.id)) {
        elite.push({ 
          id: interaction.user.id,
          joinedAt: new Date().toLocaleDateString('pt-BR')
        });
        
        // Responde ao usuário que entrou
        await interaction.reply({ 
          content: `🌟 **Bem-vindo(a) à Elite, <@${interaction.user.id}>!**\n\nVocê agora faz parte do nosso time exclusivo.`, 
          ephemeral: true 
        });

        // Procura e atualiza a última mensagem da Elite
        const messages = await interaction.channel.messages.fetch({ limit: 10 });
        const lastEliteMessage = messages.find(m => 
          m.author.id === client.user.id && 
          m.embeds.length > 0 && 
          m.embeds[0].title === '🔱 ELITE TEAM'
        );

        if (lastEliteMessage) {
          await lastEliteMessage.edit(getEliteMessage(interaction.user.id));
        }
      } else {
        await interaction.reply({ 
          content: '❌ Você já é membro da Elite!', 
          ephemeral: true 
        });
      }
    } else {
      await interaction.reply({ 
        content: '❌ Senha incorreta! Tente novamente.', 
        ephemeral: true 
      });
    }
  }
});

// Tratamento dos botões
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  
  if (interaction.customId === 'sairElite') {
    const memberIndex = elite.findIndex(u => u.id === interaction.user.id);
    if (memberIndex !== -1) {
      elite.splice(memberIndex, 1);
      
      // Responde ao usuário que saiu
      await interaction.reply({ 
        content: `👋 **Você saiu da Elite, <@${interaction.user.id}>.**`, 
        ephemeral: true 
      });

      // Atualiza a mensagem da Elite
      const messages = await interaction.channel.messages.fetch({ limit: 10 });
      const lastEliteMessage = messages.find(m => 
        m.author.id === client.user.id && 
        m.embeds.length > 0 && 
        m.embeds[0].title === '🔱 ELITE TEAM'
      );

      if (lastEliteMessage) {
        await lastEliteMessage.edit(getEliteMessage(interaction.user.id));
      }
    } else {
      await interaction.reply({ 
        content: '❌ Você não é membro da Elite!', 
        ephemeral: true 
      });
    }
  }
});

client.login(process.env.TOKEN);