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
function getEliteMessage() {
  const lista = elite.length
    ? elite.map((user, i) => `${i + 1}. <@${user.id}>`).join('\n')
    : '*Nenhum participante na Elite*';

  const buttons = [
    new ButtonBuilder()
      .setCustomId('participarElite')
      .setLabel('⭐ Entrar na Elite')
      .setStyle(ButtonStyle.Primary)
  ];

  return {
    content: `
🔱 **[ ELITE TEAM ]** 🔱

👑 **Responsável:** ${eliteResponsavel}

📋 **Participantes:**
${lista}

━━━━━━━━━━━━━━━━━━━━━`,
    components: [new ActionRowBuilder().addComponents(buttons)]
  };
}

// Função para gerar mensagem com botão de sair (para membros)
function getEliteMessageForMember(userId) {
  const lista = elite.length
    ? elite.map((user, i) => `${i + 1}. <@${user.id}>`).join('\n')
    : '*Nenhum participante na Elite*';

  const buttons = [
    new ButtonBuilder()
      .setCustomId('sairElite')
      .setLabel('🚪 Sair da Elite')
      .setStyle(ButtonStyle.Danger)
  ];

  return {
    content: `
🔱 **[ ELITE TEAM ]** 🔱

👑 **Responsável:** ${eliteResponsavel}

📋 **Participantes:**
${lista}

━━━━━━━━━━━━━━━━━━━━━`,
    components: [new ActionRowBuilder().addComponents(buttons)]
  };
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content === '!elite') {
    const isMember = elite.find(u => u.id === message.author.id);
    await message.reply(isMember ? getEliteMessageForMember(message.author.id) : getEliteMessage());
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
        m.content.includes('ELITE TEAM')
      );

      if (lastEliteMessage) {
        await lastEliteMessage.edit(getEliteMessage());
      }
    } else {
      await interaction.reply({ 
        content: '❌ Você não é membro da Elite!', 
        ephemeral: true 
      });
    }
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

        // Procura a última mensagem do bot com a lista da Elite e atualiza
        const messages = await interaction.channel.messages.fetch({ limit: 10 });
        const lastEliteMessage = messages.find(m => 
          m.author.id === client.user.id && 
          m.content.includes('ELITE TEAM')
        );

        if (lastEliteMessage) {
          await lastEliteMessage.edit(getEliteMessage());
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

client.login(process.env.TOKEN);