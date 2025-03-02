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
const fs = require('fs').promises;
const path = require('path');

// Lista de participantes da Elite
let elite = [];
const eliteResponsavel = 'Moraes';
const eliteSenha = 'elite489';

// Caminho para o arquivo de dados
const DATA_PATH = path.join(__dirname, 'elite-data.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildIntegrations
    ]
});

// Função para carregar dados
async function loadEliteData() {
    try {
        const data = await fs.readFile(DATA_PATH, 'utf8');
        elite = JSON.parse(data);
        console.log('Dados da Elite carregados com sucesso');
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Se o arquivo não existe, cria com array vazio
            await saveEliteData();
            console.log('Novo arquivo de dados da Elite criado');
        } else {
            console.error('Erro ao carregar dados da Elite:', error);
        }
    }
}

// Função para salvar dados
async function saveEliteData() {
    try {
        await fs.writeFile(DATA_PATH, JSON.stringify(elite, null, 2));
        console.log('Dados da Elite salvos com sucesso');
    } catch (error) {
        console.error('Erro ao salvar dados da Elite:', error);
    }
}

// Carrega os dados quando o bot inicia
client.once('ready', async () => {
    await loadEliteData();
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
      .setLabel('✅ Entrar na Elite')
      .setStyle(ButtonStyle.Success)
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
    components: [
      new ActionRowBuilder().addComponents(buttons[0]),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('sairElite')
          .setLabel('❌ Se Retirar')
          .setStyle(ButtonStyle.Danger)
      )
    ]
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
      .setLabel('❌ Sair da Elite')
      .setStyle(ButtonStyle.Danger)
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
  // Adiciona logs para debug
  console.log('Mensagem recebida:', message.content);
  
  if (message.author.bot) return;
  if (message.content === '!elite') {
    console.log('Comando !elite detectado');
    
    try {
      // Deleta o comando !elite
      await message.delete().catch(err => console.error('Erro ao deletar mensagem:', err));

      // Procura por mensagens fixadas da Elite
      const pinnedMessages = await message.channel.messages.fetchPinned()
        .catch(err => console.error('Erro ao buscar mensagens fixadas:', err));
        
      const existingEliteMessage = pinnedMessages?.find(m => 
        m.author.id === client.user.id && 
        m.embeds.length > 0 && 
        m.embeds[0].title === '🔱 ELITE TEAM'
      );

      if (existingEliteMessage) {
        console.log('Mensagem da Elite encontrada, atualizando...');
        // Se já existe uma mensagem fixada da Elite, apenas atualiza
        await existingEliteMessage.edit(getEliteMessage())
          .catch(err => console.error('Erro ao editar mensagem:', err));
          
        await message.channel.send({ 
          content: '✨ A mensagem da Elite já está fixada no canal!'
        }).then(msg => {
          setTimeout(() => msg.delete().catch(console.error), 5000);
        });
      } else {
        console.log('Criando nova mensagem da Elite...');
        // Se não existe, cria uma nova e fixa
        const eliteMessage = await message.channel.send(getEliteMessage())
          .catch(err => console.error('Erro ao enviar mensagem:', err));

        if (eliteMessage) {
          try {
            await eliteMessage.pin();
            await message.channel.send({ 
              content: '📌 Mensagem da Elite foi fixada no canal!'
            }).then(msg => {
              setTimeout(() => msg.delete().catch(console.error), 5000);
            });
          } catch (error) {
            console.error('Erro ao fixar mensagem:', error);
            await message.channel.send({ 
              content: '⚠️ Não foi possível fixar a mensagem. Verifique as permissões do bot.'
            }).then(msg => {
              setTimeout(() => msg.delete().catch(console.error), 5000);
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao processar comando !elite:', error);
      await message.channel.send('❌ Ocorreu um erro ao processar o comando. Verifique as permissões do bot.')
        .then(msg => setTimeout(() => msg.delete().catch(console.error), 5000));
    }
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
      
      // Salva os dados após remover membro
      await saveEliteData();
      
      await interaction.reply({ 
        content: `👋 **Você saiu da Elite, <@${interaction.user.id}>.**`, 
        ephemeral: true 
      });

      const messages = await interaction.channel.messages.fetch({ limit: 10 });
      const lastEliteMessage = messages.find(m => 
        m.author.id === client.user.id && 
        m.embeds.length > 0 && 
        m.embeds[0].title === '🔱 ELITE TEAM'
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
        
        // Salva os dados após adicionar membro
        await saveEliteData();
        
        await interaction.reply({ 
          content: `🌟 **Bem-vindo(a) à Elite, <@${interaction.user.id}>!**\n\nVocê agora faz parte do nosso time exclusivo.`, 
          ephemeral: true 
        });

        const messages = await interaction.channel.messages.fetch({ limit: 10 });
        const lastEliteMessage = messages.find(m => 
          m.author.id === client.user.id && 
          m.embeds.length > 0 && 
          m.embeds[0].title === '🔱 ELITE TEAM'
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