const {
    Client,
    GatewayIntentBits,
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    AttachmentBuilder,
    SlashCommandBuilder,
    REST,
    Routes,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const ms = require('ms');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.DISCORD_TOKEN || 'MTUzNzUyOTAwMjIzMzY5NjI3Nw.G_IOfv.ozANLheXKkV2fAPZEvuMuD0i2kR6aAhecPdHgA';

// ID DEL ROL AUTORIZADO (ROL DE VERIFICACIÓN / TALIBAN)
const ROL_VERIFICADO_ID = '1537598951904251954';

// ID DEL CANAL DE TRANSCRIPTS DIRECTO
const CANAL_TRANSCRIPTS_ID = '1537571313294647447';

// Nombres de roles para permisos del staff
const ROLES_STAFF = {
    soporte: 'Soporte',
    moderador: 'Moderador',
    administrador: 'Administrador'
};

const URL_BANNER = 'https://media.discordapp.net/attachments/1236278699234693181/1537572543828066405/Proyecto_nuevo_1.png?ex=6a7f8785&is=6a7e3605&hm=04dc1fabe16b586cc8265444e67d30e06b4b66f6d886636c18801e25f956ae43&=&format=webp&quality=lossless&width=512&height=288';
const URL_LOGO = 'https://media.discordapp.net/attachments/1236278699234693181/1537541252143259658/logo_TS.png?ex=6a7f6a60&is=6a7e18e0&hm=1ff4d57f5687916ff2817fbd5d7085aea0c20449329479fd125ccf292acedbc6&=&format=webp&quality=lossless&width=1024&height=1024';

// Map en memoria para sorteos
const giveawaysMap = new Map();

// Helper: Verificar si es ADMIN / STAFF / OWNER / CO OWNER
function esStaffOAdmin(member) {
    if (!member) return false;
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

    const rolesStaff = ['OWNER', 'CO OWNER', ROLES_STAFF.soporte.toUpperCase(), ROLES_STAFF.moderador.toUpperCase(), ROLES_STAFF.administrador.toUpperCase()];
    return member.roles.cache.some(r => rolesStaff.includes(r.name.toUpperCase().trim()));
}

// ======================================================
// EVENTO: BIENVENIDA A NUEVOS MIEMBROS
// ======================================================
client.on('guildMemberAdd', async member => {
    try {
        const canalBienvenida = member.guild.channels.cache.find(c => c.name === '👋・bienvenidas' && c.type === ChannelType.GuildText);
        if (!canalBienvenida) return;

        const embedBienvenida = new EmbedBuilder()
            .setColor(0xED4245)
            .setAuthor({ 
                name: 'TALIBAN SCAN', 
                iconURL: member.guild.iconURL({ dynamic: true }) || URL_LOGO 
            })
            .setTitle('👋 • Bienvenid@ al servidor')
            .setDescription(
                `¡Bienvenido/a ${member} a **TALIBAN SCAN**! 🎉\n\n` +
                `Esperamos que disfrutes de tu estadía y te diviertas con la comunidad.\n` +
                `No olvides pasar por el canal de verificación para obtener acceso total.`
            )
            .setThumbnail(URL_LOGO)
            .setImage(URL_BANNER)
            .setFooter({ text: `TALIBAN SCAN • Miembro #${member.guild.memberCount}` })
            .setTimestamp();

        await canalBienvenida.send({
            content: `👋 ¡Hola ${member}!`,
            embeds: [embedBienvenida]
        });
    } catch (e) {
        console.error('Error al enviar mensaje de bienvenida:', e);
    }
});

// ======================================================
// BOT ONLINE Y REGISTRO DE COMANDOS
// ======================================================

client.once('clientReady', async () => {
    console.log(`✅ ${client.user.tag} conectado correctamente.`);

    client.user.setPresence({
        activities: [{ name: 'TALIBAN SCAN', type: 3 }],
        status: 'online'
    });

    const commands = [
        new SlashCommandBuilder()
            .setName('setup')
            .setDescription('Configura la estructura general del servidor TALIBAN SCAN.')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        new SlashCommandBuilder()
            .setName('setup-rol')
            .setDescription('Envía el mensaje con el botón de Verificación en el canal actual.')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        new SlashCommandBuilder()
            .setName('setup-precios')
            .setDescription('Crea/actualiza únicamente el canal de precios.')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        new SlashCommandBuilder()
            .setName('setup-metodos')
            .setDescription('Envía el mensaje fijado con los métodos de pago.')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        new SlashCommandBuilder()
            .setName('setup-terms')
            .setDescription('Crea el canal y envía los Términos y Condiciones del servicio.')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        new SlashCommandBuilder()
            .setName('setup-giveaway')
            .setDescription('Crea el canal dedicado para los Sorteos / Giveaways.')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        new SlashCommandBuilder()
            .setName('gstart')
            .setDescription('Inicia un nuevo sorteo.')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addStringOption(opt => opt.setName('duracion').setDescription('Duración del sorteo (ej: 10m, 1h, 1d)').setRequired(true))
            .addIntegerOption(opt => opt.setName('ganadores').setDescription('Número de ganadores').setRequired(true))
            .addStringOption(opt => opt.setName('premio').setDescription('Premio del sorteo').setRequired(true))
            .addStringOption(opt => opt.setName('descripcion').setDescription('Descripción o motivo del sorteo').setRequired(false))
            .addChannelOption(opt => opt.setName('canal').setDescription('Canal donde publicar el sorteo').setRequired(false)),

        new SlashCommandBuilder()
            .setName('ticket')
            .setDescription('Comandos de gestión de tickets de TALIBAN SCAN')
            .addSubcommand(sub =>
                sub.setName('add')
                   .setDescription('Añade a un usuario al ticket actual')
                   .addUserOption(opt => opt.setName('usuario').setDescription('El usuario a añadir').setRequired(true))
            )
            .addSubcommand(sub =>
                sub.setName('remove')
                   .setDescription('Remueve a un usuario del ticket actual')
                   .addUserOption(opt => opt.setName('usuario').setDescription('El usuario a remover').setRequired(true))
            )
            .addSubcommand(sub =>
                sub.setName('rename')
                   .setDescription('Renombra el ticket actual')
                   .addStringOption(opt => opt.setName('nombre').setDescription('Nuevo nombre para el ticket').setRequired(true))
            )
            .addSubcommand(sub =>
                sub.setName('close')
                   .setDescription('Cierra el ticket actual')
            )
    ].map(cmd => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {
        for (const guild of client.guilds.cache.values()) {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, guild.id),
                { body: commands }
            );
        }
        console.log('✅ Comandos Slash registrados instantáneamente.');
    } catch (error) {
        console.error('❌ Error registrando comandos:', error);
    }
});

// ======================================================
// COMANDOS DE TEXTO (!feedback y !metodos)
// ======================================================

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === '!feedback') {
        const member = message.member;
        const channel = message.channel;

        // 1. Validar por la ID EXACTA DEL ROL (1537598951904251954)
        const tieneRolAutorizado = member.roles.cache.has(ROL_VERIFICADO_ID);

        if (!tieneRolAutorizado) {
            return message.reply(`❌ Necesitas tener el rol <@&${ROL_VERIFICADO_ID}> para utilizar este comando.`)
                .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
        }

        // 2. Validar si el ticket está dentro de una categoría que contenga "COMPRAS" o "COMPRA"
        const nombreCategoria = channel.parent ? channel.parent.name.toUpperCase() : '';
        const esTicketCompras = nombreCategoria.includes('COMPRAS') || nombreCategoria.includes('COMPRA');

        if (!esTicketCompras) {
            return message.reply('❌ Este comando solo se puede utilizar en la categoría de **COMPRAS**.')
                .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
        }

        await message.delete().catch(() => {});

        const embedFeedbackPrompt = new EmbedBuilder()
            .setColor(0xFEE75C)
            .setTitle('⭐ VALORA NUESTRA ATENCIÓN')
            .setDescription(
                `¡Hola! Tu ticket ha sido atendido por **${message.author}**.\n\n` +
                'Por favor, tómate un segundo para calificar la calidad de nuestro soporte seleccionando una puntuación de abajo:'
            )
            .setFooter({ text: 'TALIBAN SCAN • Tu opinión nos ayuda a mejorar' });

        const rowEstrellas = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`star_1_${message.author.id}`).setLabel('1 ⭐').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`star_2_${message.author.id}`).setLabel('2 ⭐').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`star_3_${message.author.id}`).setLabel('3 ⭐').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`star_4_${message.author.id}`).setLabel('4 ⭐').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`star_5_${message.author.id}`).setLabel('5 ⭐').setStyle(ButtonStyle.Success)
        );

        await message.channel.send({
            embeds: [embedFeedbackPrompt],
            components: [rowEstrellas]
        });
    }

    if (message.content.toLowerCase() === '!metodos') {
        const embedMetodos = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('💳 TALIBAN SCAN | MÉTODOS DE PAGO')
            .setDescription(
                'Aceptamos los siguientes métodos de pago para la adquisición de cualquier tipo de licencia:\n\n' +
                '📲 **Bizum** *(Instantáneo y sin comisiones)*\n' +
                '💙 **PayPal** *(Amigos y Familiares)*\n' +
                '💳 **Paysafecard** *(PIN de recarga)*\n\n' +
                '🛒 **¿Cómo pagar?** Abre un ticket de compra y dinos qué método de pago prefieres utilizar.'
            )
            .setThumbnail(URL_LOGO)
            .setFooter({ text: 'TALIBAN SCAN • Transacciones Rápidas y Seguras' });

        await message.channel.send({ embeds: [embedMetodos] });
    }
});

// ======================================================
// INTERACCIONES Y COMANDOS SLASH
// ======================================================

client.on('interactionCreate', async interaction => {

    // --- MANEJO DE FORMULARIO EMERGENTE (MODAL) DE FEEDBACK ---
    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('feedback_modal_')) {
            const parts = interaction.customId.split('_');
            const estrellas = parts[2];
            const staffId = parts[3];
            
            const opinionTexto = interaction.fields.getTextInputValue('opinion_input');

            const canalFeedback = interaction.guild.channels.cache.find(c => c.name === '💬・feedback' && c.type === ChannelType.GuildText);

            const embedValoracion = new EmbedBuilder()
                .setColor(0xFEE75C)
                .setTitle('⭐ NUEVA VALORACIÓN RECIBIDA')
                .addFields(
                    { name: '👤 Cliente', value: `${interaction.user}`, inline: true },
                    { name: '🛡️ Atendido por', value: `<@${staffId}>`, inline: true },
                    { name: '⭐ Calificación', value: '⭐'.repeat(parseInt(estrellas)), inline: false },
                    { name: '💬 Opinión', value: opinionTexto || '*Sin comentarios.*', inline: false }
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'TALIBAN SCAN • Opinión registrada' })
                .setTimestamp();

            if (canalFeedback) {
                await canalFeedback.send({ embeds: [embedValoracion] });
            }

            return await interaction.reply({ 
                content: `✅ ¡Muchas gracias por tu valoración de **${estrellas} estrellas** y tu comentario!`, 
                ephemeral: true 
            });
        }
    }

    // --- MANEJO DE COMANDOS /ticket ---
    if (interaction.isChatInputCommand() && interaction.commandName === 'ticket') {
        if (!esStaffOAdmin(interaction.member)) {
            return interaction.reply({ content: '❌ Solo el Staff / Administradores pueden gestionar los tickets.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const usuario = interaction.options.getUser('usuario');
            await interaction.channel.permissionOverwrites.edit(usuario.id, {
                ViewChannel: true,
                SendMessages: true,
                AttachFiles: true,
                ReadMessageHistory: true
            });
            return interaction.reply({ content: `✅ Usuario ${usuario} añadido al ticket.` });
        }

        if (subcommand === 'remove') {
            const usuario = interaction.options.getUser('usuario');
            await interaction.channel.permissionOverwrites.delete(usuario.id);
            return interaction.reply({ content: `✅ Usuario ${usuario} removido del ticket.` });
        }

        if (subcommand === 'rename') {
            const nuevoNombre = interaction.options.getString('nombre');
            await interaction.channel.setName(nuevoNombre);
            return interaction.reply({ content: `✅ Ticket renombrado a: \`${nuevoNombre}\`` });
        }

        if (subcommand === 'close') {
            await interaction.reply({ content: '🔒 Generando transcript y cerrando ticket en 5 segundos...' });
            
            const canal = interaction.channel;
            const guild = interaction.guild;

            const mensajes = await canal.messages.fetch({ limit: 100 });
            let transcripcionTexto = `--- TRANSCRIPCIÓN DEL TICKET: ${canal.name} ---\n\n`;
            
            mensajes.reverse().forEach(m => {
                transcripcionTexto += `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}\n`;
            });

            const buffer = Buffer.from(transcripcionTexto, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { name: `transcript-${canal.name}.txt` });

            const canalTranscripts = guild.channels.cache.get(CANAL_TRANSCRIPTS_ID);
            if (canalTranscripts) {
                const embedLogTranscript = new EmbedBuilder()
                    .setColor(0xED4245)
                    .setTitle('📝 Ticket Cerrado')
                    .addFields(
                        { name: 'Canal', value: canal.name, inline: true },
                        { name: 'Cerrado por', value: interaction.user.tag, inline: true }
                    )
                    .setTimestamp();

                await canalTranscripts.send({ embeds: [embedLogTranscript], files: [attachment] });
            }

            setTimeout(async () => {
                await canal.delete().catch(() => {});
            }, 5000);
            return;
        }
    }

    if (!interaction.isChatInputCommand()) return;

    const comandosProtegidos = ['setup', 'setup-rol', 'setup-precios', 'setup-metodos', 'setup-terms', 'setup-giveaway', 'gstart'];
    
    if (comandosProtegidos.includes(interaction.commandName)) {
        if (!esStaffOAdmin(interaction.member)) {
            return interaction.reply({
                content: '❌ No tienes permisos para usar este comando. Se requiere permisos de **Administrador / Staff**.',
                ephemeral: true
            });
        }
    }

    // --- COMANDO: /setup-rol ---
    if (interaction.commandName === 'setup-rol') {
        const btnVerificar = new ButtonBuilder()
            .setCustomId('verificar')
            .setLabel('Verificarme')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success);
        
        const embedVerif = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('🔐 VERIFICACIÓN DE SEGURIDAD')
            .setDescription('Bienvenido/a a **TALIBAN SCAN**.\n\nPulsa el botón de abajo para verificar tu cuenta y recibir acceso total al servidor.')
            .setThumbnail(URL_LOGO)
            .setFooter({ text: 'TALIBAN SCAN • Sistema de Verificación' });

        await interaction.channel.send({
            embeds: [embedVerif],
            components: [new ActionRowBuilder().addComponents(btnVerificar)]
        });

        return interaction.reply({ content: '✅ Panel de verificación desplegado correctamente en este canal.', ephemeral: true });
    }

    if (interaction.commandName === 'setup-giveaway') {
        const guild = interaction.guild;
        let catComunidad = guild.channels.cache.find(c => c.name === '👋 COMUNIDAD' && c.type === ChannelType.GuildCategory);
        if (!catComunidad) catComunidad = await guild.channels.create({ name: '👋 COMUNIDAD', type: ChannelType.GuildCategory });

        let canalGiveaway = guild.channels.cache.find(c => c.name === '🎉・sorteos' && c.type === ChannelType.GuildText);
        if (!canalGiveaway) {
            canalGiveaway = await guild.channels.create({ name: '🎉・sorteos', type: ChannelType.GuildText, parent: catComunidad.id });
        }

        return interaction.reply({ content: `✅ Canal de sorteos configurado: ${canalGiveaway}`, ephemeral: true });
    }

    if (interaction.commandName === 'gstart') {
        const duracionStr = interaction.options.getString('duracion');
        const numGanadores = interaction.options.getInteger('ganadores');
        const premio = interaction.options.getString('premio');
        const descripcion = interaction.options.getString('descripcion') || '';
        const canalObjetivo = interaction.options.getChannel('canal') || interaction.channel;

        const duracionMs = ms(duracionStr);
        if (!duracionMs || duracionMs < 5000) {
            return interaction.reply({ content: '❌ Especifica una duración válida (ejemplo: `10m`, `2h`, `1d`). Mínimo 5s.', ephemeral: true });
        }

        const tiempoFin = Math.floor((Date.now() + duracionMs) / 1000);

        const embedStart = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setTitle(premio)
            .setDescription(
                (descripcion ? `${descripcion}\n\n` : '') +
                `Ends: <t:${tiempoFin}:R> (<t:${tiempoFin}:f>)\n` +
                `Hosted by: ${interaction.user}\n` +
                `Entries: **0**\n` +
                `Winners: **${numGanadores}**`
            )
            .setFooter({ text: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) });

        const btnEntrar = new ButtonBuilder()
            .setCustomId('join_giveaway')
            .setEmoji('🎉')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(btnEntrar);

        const msgG = await canalObjetivo.send({
            embeds: [embedStart],
            components: [row]
        });

        giveawaysMap.set(msgG.id, {
            host: interaction.user,
            premio: premio,
            numGanadores: numGanadores,
            descripcion: descripcion,
            participantes: new Set(),
            tiempoFin: tiempoFin,
            canalId: canalObjetivo.id
        });

        await interaction.reply({ content: `✅ Sorteo iniciado con éxito en ${canalObjetivo}`, ephemeral: true });

        setTimeout(() => finalizarSorteo(msgG.id, interaction.guild), duracionMs);
    }

    if (interaction.commandName === 'setup') {
        await interaction.reply({ content: '⚙️ Configurando servidor...', ephemeral: true });
        const guild = interaction.guild;

        try {
            async function crearCategoria(nombre) {
                let cat = guild.channels.cache.find(c => c.name === nombre && c.type === ChannelType.GuildCategory);
                if (!cat) cat = await guild.channels.create({ name: nombre, type: ChannelType.GuildCategory });
                return cat;
            }

            const categoriaInfo = await crearCategoria('📌 INFORMACIÓN');
            const categoriaComunidad = await crearCategoria('👋 COMUNIDAD');
            const categoriaSoporte = await crearCategoria('🎫 SOPORTE');
            const categoriaStaff = await crearCategoria('🔒 STAFF');
            await crearCategoria('📜 TRANSCRIPTS');

            async function crearCanal(nombre, categoria) {
                let canal = guild.channels.cache.find(c => c.name === nombre && c.type === ChannelType.GuildText);
                if (!canal) canal = await guild.channels.create({ name: nombre, type: ChannelType.GuildText, parent: categoria.id });
                return canal;
            }

            const reglas = await crearCanal('📜・reglas', categoriaInfo);
            await crearCanal('📢・anuncios', categoriaInfo);
            const verificacion = await crearCanal('🔐・verificación', categoriaInfo);

            await crearCanal('💬・chat', categoriaComunidad);
            await crearCanal('👋・bienvenidas', categoriaComunidad);
            await crearCanal('🚪・salidas', categoriaComunidad);
            await crearCanal('🎉・sorteos', categoriaComunidad);

            const tickets = await crearCanal('🎫・tickets', categoriaSoporte);
            await crearCanal('💬・feedback', categoriaSoporte);

            await crearCanal('📋・logs', categoriaStaff);
            await crearCanal('🛡️・mod-logs', categoriaStaff);
            await crearCanal('👑・staff-chat', categoriaStaff);

            await reglas.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('📜 REGLAS DE TALIBAN SCAN')
                        .setDescription('1. Respeta a los demás.\n2. Sin spam.\n3. Usa los canales correctamente.\n4. No compartas información personal.\n5. Respeta al Staff.')
                ]
            });

            const btnVerificar = new ButtonBuilder().setCustomId('verificar').setLabel('Verificarme').setEmoji('✅').setStyle(ButtonStyle.Success);
            
            const embedVerif = new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle('🔐 VERIFICACIÓN DE SEGURIDAD')
                .setDescription('Bienvenido/a a **TALIBAN SCAN**.\n\nPulsa el botón de abajo para verificar tu cuenta y recibir acceso total.')
                .setThumbnail(URL_LOGO)
                .setFooter({ text: 'TALIBAN SCAN • Sistema de verificación' });

            await verificacion.send({
                embeds: [embedVerif],
                components: [new ActionRowBuilder().addComponents(btnVerificar)]
            });

            const embedTickets = new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle('🔹 TALIBAN SCAN | CENTRO DE SOPORTE GLOBAL')
                .setDescription(
                    '¡Hola! ¿Necesitas ayuda? Has llegado al lugar indicado.\n\n' +
                    '**Nuestro Horario de Soporte:**\n' +
                    '⏱️ Estamos disponibles **24/7**, pero los tiempos de respuesta pueden variar según la disponibilidad del Staff.\n\n' +
                    '**Antes de abrir un ticket:**\n' +
                    `✅ Asegúrate de haber leído nuestras ${reglas}.\n` +
                    '✅ Sé lo más descriptivo posible en tu solicitud.\n' +
                    '✅ No menciones a miembros del staff; seremos notificados automáticamente.\n\n'
                )
                .addFields(
                    { name: '💡 Ayuda y Dudas', value: 'Preguntas generales del servidor o problemas técnicos.', inline: true },
                    { name: '⚠️ Reportes', value: 'Reportar usuarios o staff por incumplir normas.', inline: true },
                    { name: '🔎 Leaks', value: 'Dudas o problemas relacionados con contenido filtrado.', inline: true },
                    { name: '💰 Compras', value: 'Problemas con pedidos, pagos o la tienda.', inline: false }
                )
                .setImage(URL_BANNER)
                .setFooter({ 
                    text: 'TALIBAN SCAN - Sistema de Soporte Seguro', 
                    iconURL: guild.iconURL({ dynamic: true }) || undefined
                });

            const menuTickets = new StringSelectMenuBuilder()
                .setCustomId('ticket_categoria')
                .setPlaceholder('📩 Haz clic aquí para elegir una categoría...')
                .addOptions([
                    { label: 'Ayuda General', value: 'ayuda', emoji: '💡' },
                    { label: 'Reportar Jugador', value: 'reporte', emoji: '⚠️' },
                    { label: 'Soporte de Leaks', value: 'leaks', emoji: '🔎' },
                    { label: 'Tienda y Pagos', value: 'tienda', emoji: '💰' }
                ]);

            await tickets.send({
                embeds: [embedTickets],
                components: [new ActionRowBuilder().addComponents(menuTickets)]
            });

            await interaction.editReply({ content: '✅ Configuración general completada.' });

        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: '❌ Error en la configuración.' });
        }
    }

    if (interaction.commandName === 'setup-precios') {
        await interaction.reply({ content: '⚙️ Configurando el canal de precios...', ephemeral: true });
        const guild = interaction.guild;

        try {
            let catInfo = guild.channels.cache.find(c => c.name === '📌 INFORMACIÓN' && c.type === ChannelType.GuildCategory);
            if (!catInfo) catInfo = await guild.channels.create({ name: '📌 INFORMACIÓN', type: ChannelType.GuildCategory });

            let canalPrecios = guild.channels.cache.find(c => c.name === '💰・precios' && c.type === ChannelType.GuildText);
            if (!canalPrecios) {
                canalPrecios = await guild.channels.create({ name: '💰・precios', type: ChannelType.GuildText, parent: catInfo.id });
            }

            const canalTickets = guild.channels.cache.find(c => c.name === '🎫・tickets' && c.type === ChannelType.GuildText);
            const menciónTickets = canalTickets ? `${canalTickets}` : '`#🎫・tickets`';

            const embedPrecios = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle('💎 TALIBAN SCAN | PRECIOS DE LICENCIAS')
                .setDescription(
                    '¡Obtén el **Scanner de FiveM** definitivo para detectar cualquier tipo de archivo, script o inyección no autorizada de forma instantánea y 100% indetectable!\n\n' +
                    '🛒 **¿CÓMO COMPRAR?**\n' +
                    `Abre un ticket en el canal ${menciónTickets} seleccionando la categoría **💰 Compras**.\n\n` +
                    '───────────────'
                )
                .addFields(
                    { 
                        name: '🗓️ Licencia Semanal', 
                        value: '```yaml\nPrecio: 4,99 € / semana\n```\n• Acceso total por 7 días.\n• Soporte básico en tickets.\n• Actualizaciones incluidas.', 
                        inline: false 
                    },
                    { 
                        name: '📆 Licencia Mensual', 
                        value: '```yaml\nPrecio: 19,99 € / mes\n```\n• Acceso completo por 30 días.\n• Soporte prioritario 24/7.\n• Acceso a novedades y parches.', 
                        inline: false 
                    },
                    { 
                        name: '👑 Licencia Lifetime (De por vida)', 
                        value: '```yaml\nPrecio: 39,99 € (Pago Único)\n```\n• Acceso ILIMITADO de por vida.\n• Máxima prioridad en Soporte Técnico.\n• Rol VIP exclusivo en el servidor.', 
                        inline: false 
                    }
                )
                .setImage(URL_BANNER)
                .setFooter({ 
                    text: 'TALIBAN SCAN • Tienda Oficial', 
                    iconURL: guild.iconURL({ dynamic: true }) || undefined 
                });

            await canalPrecios.send({ embeds: [embedPrecios] });
            await interaction.editReply({ content: `✅ Canal ${canalPrecios} configurado correctamente.` });

        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: '❌ Error al configurar el canal de precios.' });
        }
    }

    if (interaction.commandName === 'setup-metodos') {
        const embedMetodos = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('💳 TALIBAN SCAN | MÉTODOS DE PAGO')
            .setDescription(
                'Aceptamos los siguientes métodos de pago para la adquisición de cualquier tipo de licencia:\n\n' +
                '📲 **Bizum** *(Instantáneo y sin comisiones)*\n' +
                '💙 **PayPal** *(Amigos y Familiares)*\n' +
                '💳 **Paysafecard** *(PIN de recarga)*\n\n' +
                '🛒 **¿Cómo pagar?** Abre un ticket de compra y dinos qué método de pago prefieres utilizar.'
            )
            .setThumbnail(URL_LOGO)
            .setFooter({ text: 'TALIBAN SCAN • Transacciones Rápidas y Seguras' });

        await interaction.channel.send({ embeds: [embedMetodos] });
        await interaction.reply({ content: '✅ Mensaje de métodos publicado en este canal.', ephemeral: true });
    }

    if (interaction.commandName === 'setup-terms') {
        await interaction.reply({ content: '⚙️ Configurando el canal de Términos y Condiciones...', ephemeral: true });
        const guild = interaction.guild;

        try {
            let catInfo = guild.channels.cache.find(c => c.name === '📌 INFORMACIÓN' && c.type === ChannelType.GuildCategory);
            if (!catInfo) catInfo = await guild.channels.create({ name: '📌 INFORMACIÓN', type: ChannelType.GuildCategory });

            let canalTerms = guild.channels.cache.find(c => c.name === '📜・términos' && c.type === ChannelType.GuildText);
            if (!canalTerms) {
                canalTerms = await guild.channels.create({ name: '📜・términos', type: ChannelType.GuildText, parent: catInfo.id });
            }

            const embedTerms = new EmbedBuilder()
                .setColor(0xE74C3C)
                .setTitle('📜 TALIBAN SCAN | TÉRMINOS Y CONDICIONES')
                .setDescription(
                    'Al adquirir, descargar o hacer uso de las licencias y servicios de **TALIBAN SCAN**, aceptas de manera incondicional los siguientes Términos y Condiciones del Servicio:\n\n' +
                    '📌 **1. ACEPTACIÓN DE LICENCIAS Y PRODUCTO**\n' +
                    '• Toda compra otorga una licencia de uso personal, no transferible e individual.\n' +
                    '• Queda totalmente prohibida la reventa, distribución o intento de ingeniería inversa del software.\n\n' +
                    '💸 **2. POLÍTICA DE REEMBOLSOS Y DEVOLUCIONES**\n' +
                    '• Debido a la naturaleza digital de nuestros productos, **NO** se realizan reembolsos de ningún tipo bajo ninguna circunstancia una vez entregada la clave de producto.\n' +
                    '• Todas las ventas son finales.\n\n' +
                    '🛡️ **3. NORMAS Y USO RESPONSABLE**\n' +
                    '• El comprador es 100% responsable del uso que le dé al scanner en sus servidores o entorno de ejecución.\n' +
                    '• Queda totalmente prohibido el uso del software para actividades malintencionadas fuera de los términos previstos.\n\n' +
                    '🔒 **4. DERECHO DE ADMISIÓN Y SANCIONES**\n' +
                    '• Nos reservamos el derecho de revocar cualquier licencia o bloquear el acceso a un usuario sin reembolso si se detectan faltas de respeto al Staff, intentos de estafa o vulneración de seguridad.\n\n' +
                    '⚠️ **5. MODIFICACIONES Y ACTUALIZACIONES**\n' +
                    '• Nos reservamos el derecho de modificar o actualizar las licencias, características técnicas o términos en cualquier momento según las necesidades del servicio.'
                )
                .setImage(URL_BANNER)
                .setThumbnail(URL_LOGO)
                .setFooter({ 
                    text: 'TALIBAN SCAN • Garantía y Términos Legales', 
                    iconURL: guild.iconURL({ dynamic: true }) || undefined 
                });

            await canalTerms.send({ embeds: [embedTerms] });
            await interaction.editReply({ content: `✅ Canal ${canalTerms} creado y términos publicados correctamente.` });

        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: '❌ Error al configurar el canal de términos.' });
        }
    }
});

// ======================================================
// MANEJO DE TICKETS, VERIFICACIÓN Y BOTONES
// ======================================================

client.on('interactionCreate', async interaction => {

    // --- MENÚ DESPLEGABLE DE TICKETS ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_categoria') {
        const categoriaSeleccionada = interaction.values[0];
        const guild = interaction.guild;
        const user = interaction.user;

        await interaction.deferReply({ ephemeral: true });

        try {
            const nombreCanal = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            const canalExistente = guild.channels.cache.find(c => c.name === nombreCanal);
            if (canalExistente) {
                return await interaction.editReply({ content: `⚠️ Ya tienes un ticket abierto en ${canalExistente}.` });
            }

            let nombreCategoriaTarget = '📂 TICKETS ABIERTOS';
            if (categoriaSeleccionada === 'ayuda') nombreCategoriaTarget = 'TICKETS GENERALES';
            if (categoriaSeleccionada === 'reporte') nombreCategoriaTarget = 'TICKETS REPORTES';
            if (categoriaSeleccionada === 'leaks') nombreCategoriaTarget = 'TICKETS LEAKS';
            if (categoriaSeleccionada === 'tienda') nombreCategoriaTarget = 'TICKETS COMPRAS';

            let catDestino = guild.channels.cache.find(c => c.name.toLowerCase().includes(nombreCategoriaTarget.toLowerCase()) && c.type === ChannelType.GuildCategory);
            if (!catDestino) {
                catDestino = await guild.channels.create({ name: nombreCategoriaTarget, type: ChannelType.GuildCategory });
            }

            const rolSoporte = guild.roles.cache.find(r => r.name.toLowerCase() === ROLES_STAFF.soporte.toLowerCase());

            const permissionOverwrites = [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                }
            ];

            if (rolSoporte) {
                permissionOverwrites.push({
                    id: rolSoporte.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                });
            }

            const ticketChannel = await guild.channels.create({
                name: `ticket-${user.username}`,
                type: ChannelType.GuildText,
                parent: catDestino.id,
                permissionOverwrites: permissionOverwrites
            });

            const embedBienvenidaTicket = new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle(`🎫 TICKET DE SOPORTE | Categoría: ${categoriaSeleccionada.toUpperCase()}`)
                .setDescription(`Hola ${user}, bienvenido/a a tu ticket de soporte.\nUn miembro del equipo te atenderá pronto.\n\nPor favor, describe tu consulta o problema con detalle.`)
                .setFooter({ text: 'TALIBAN SCAN • Sistema de Tickets', iconURL: URL_LOGO });

            const rowBotonesTicket = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('cerrar_ticket').setLabel('Cerrar Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('reclamar_ticket').setLabel('Reclamar Ticket').setEmoji('✋').setStyle(ButtonStyle.Primary)
            );

            await ticketChannel.send({
                content: `${user} | ${rolSoporte ? rolSoporte : '@Staff'}`,
                embeds: [embedBienvenidaTicket],
                components: [rowBotonesTicket]
            });

            await interaction.editReply({ content: `✅ Ticket creado correctamente en su categoría correspondiente: ${ticketChannel}` });

        } catch (error) {
            console.error('Error al crear el ticket:', error);
            await interaction.editReply({ content: '❌ Ocurrió un error al crear el ticket. Asegúrate de que mi BOT tenga el permiso **Gestionar Canales** y esté posicionado arriba en Roles.' });
        }
    }

    if (!interaction.isButton()) return;

    // --- RECLAMAR TICKET ---
    if (interaction.customId === 'reclamar_ticket') {
        if (!esStaffOAdmin(interaction.member)) {
            return await interaction.reply({ content: '❌ Solo los Administradores o miembros del Staff pueden reclamar tickets.', ephemeral: true });
        }

        const embedReclamado = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`✋ Este ticket ha sido reclamado por ${interaction.member}. Te atenderá personalmente.`);

        await interaction.channel.send({ embeds: [embedReclamado] });
        return await interaction.reply({ content: 'Has reclamado este ticket.', ephemeral: true });
    }

    // --- CERRAR TICKET VIA BOTÓN ---
    if (interaction.customId === 'cerrar_ticket') {
        if (!esStaffOAdmin(interaction.member)) {
            return await interaction.reply({ content: '❌ Solo los Administradores o el Staff pueden cerrar tickets.', ephemeral: true });
        }

        await interaction.reply({ content: '🔒 Guardando conversación y cerrando ticket en 5 segundos...' });

        const canal = interaction.channel;
        const guild = interaction.guild;

        const mensajes = await canal.messages.fetch({ limit: 100 });
        let transcripcionTexto = `--- TRANSCRIPCIÓN DEL TICKET: ${canal.name} ---\n\n`;
        
        mensajes.reverse().forEach(m => {
            transcripcionTexto += `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}\n`;
        });

        const buffer = Buffer.from(transcripcionTexto, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { name: `transcript-${canal.name}.txt` });

        const canalTranscripts = guild.channels.cache.get(CANAL_TRANSCRIPTS_ID);
        if (canalTranscripts) {
            const embedLogTranscript = new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle('📝 Ticket Cerrado')
                .addFields(
                    { name: 'Canal', value: canal.name, inline: true },
                    { name: 'Cerrado por', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();

            await canalTranscripts.send({ embeds: [embedLogTranscript], files: [attachment] });
        }

        setTimeout(async () => {
            await canal.delete().catch(() => {});
        }, 5000);
        return;
    }

    // --- DESPLIEGUE DEL MODAL AL PULSAR BOTÓN DE ESTRELLAS ---
    if (interaction.customId.startsWith('star_')) {
        const parts = interaction.customId.split('_');
        const estrellas = parts[1];
        const staffId = parts[2];

        // Crear ventana emergente (Modal)
        const modal = new ModalBuilder()
            .setCustomId(`feedback_modal_${estrellas}_${staffId}`)
            .setTitle(`Valoración de ${estrellas} ⭐`);

        const opinionInput = new TextInputBuilder()
            .setCustomId('opinion_input')
            .setLabel('¿Cuál es tu opinión sobre el soporte?')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Escribe aquí tus comentarios, sugerencias o agradecimiento...')
            .setRequired(true)
            .setMaxLength(1000);

        const firstActionRow = new ActionRowBuilder().addComponents(opinionInput);
        modal.addComponents(firstActionRow);

        // Mostrar formulario al usuario
        await interaction.showModal(modal);

        // Borrar el mensaje de valoración original tras presionar el botón
        await interaction.message.delete().catch(() => {});
        return;
    }

    // --- BOTÓN DE VERIFICACIÓN ---
    if (interaction.customId === 'verificar') {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const rolExacto = guild.roles.cache.get(ROL_VERIFICADO_ID);

        if (!rolExacto) {
            return interaction.editReply({
                content: '❌ No se encontró el rol de verificación con el ID especificado en este servidor.'
            });
        }

        if (interaction.member.roles.cache.has(ROL_VERIFICADO_ID)) {
            return interaction.editReply({
                content: `✅ Ya estás verificado/a y tienes asignado el rol <@&${ROL_VERIFICADO_ID}>.`
            });
        }

        try {
            await interaction.member.roles.add(rolExacto);
            return interaction.editReply({
                content: `✅ ¡Te has verificado con éxito en **TALIBAN SCAN**! Se te ha asignado el rol <@&${ROL_VERIFICADO_ID}>.`
            });
        } catch (err) {
            console.error(err);
            return interaction.editReply({
                content: '❌ No se pudo asignar el rol. Asegúrate en Ajustes del Servidor > Roles que el rol de mi BOT esté situado **POR ENCIMA** del rol que intento asignar.'
            });
        }
    }

    // --- PARTICIPACIÓN EN SORTEOS ---
    if (interaction.customId === 'join_giveaway') {
        const giveawayData = giveawaysMap.get(interaction.message.id);

        if (!giveawayData) {
            return interaction.reply({ content: '❌ Este sorteo ya ha finalizado o no está disponible.', ephemeral: true });
        }

        const userId = interaction.user.id;

        if (giveawayData.participantes.has(userId)) {
            giveawayData.participantes.delete(userId);
            await interaction.reply({ content: '❌ Has salido del sorteo.', ephemeral: true });
        } else {
            giveawayData.participantes.add(userId);
            await interaction.reply({ content: '🎉 ¡Has entrado al sorteo con éxito!', ephemeral: true });
        }

        const embedOriginal = interaction.message.embeds[0];
        const updatedEmbed = EmbedBuilder.from(embedOriginal).setDescription(
            (giveawayData.descripcion ? `${giveawayData.descripcion}\n\n` : '') +
            `Ends: <t:${giveawayData.tiempoFin}:R> (<t:${giveawayData.tiempoFin}:f>)\n` +
            `Hosted by: ${giveawayData.host}\n` +
            `Entries: **${giveawayData.participantes.size}**\n` +
            `Winners: **${giveawayData.numGanadores}**`
        );

        await interaction.message.edit({ embeds: [updatedEmbed] });
    }
});

// ======================================================
// LÓGICA PARA FINALIZAR SORTEOS
// ======================================================

async function finalizarSorteo(messageId, guild) {
    const data = giveawaysMap.get(messageId);
    if (!data) return;

    try {
        const canal = guild.channels.cache.get(data.canalId);
        if (!canal) return;

        const mensaje = await canal.messages.fetch(messageId).catch(() => null);
        if (!mensaje) return;

        const arrayParticipantes = Array.from(data.participantes);
        let ganadoresMencion = [];

        if (arrayParticipantes.length === 0) {
            ganadoresMencion = ['No hay suficientes participantes.'];
        } else {
            for (let i = arrayParticipantes.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arrayParticipantes[i], arrayParticipantes[j]] = [arrayParticipantes[j], arrayParticipantes[i]];
            }

            const ganadoresIds = arrayParticipantes.slice(0, Math.min(data.numGanadores, arrayParticipantes.length));
            ganadoresMencion = ganadoresIds.map(id => `<@${id}>`);
        }

        const tiempoAhora = Math.floor(Date.now() / 1000);

        const embedFinal = new EmbedBuilder()
            .setColor(0x111214)
            .setTitle(data.premio)
            .setDescription(
                (data.descripcion ? `${data.descripcion}\n\n` : '') +
                `Ended: <t:${tiempoAhora}:R> (<t:${tiempoAhora}:f>)\n` +
                `Hosted by: ${data.host}\n` +
                `Winners: ${ganadoresMencion.join(', ')}`
            )
            .setFooter({ text: 'Sorteo Finalizado' });

        await mensaje.edit({ embeds: [embedFinal], components: [] });

        if (arrayParticipantes.length > 0) {
            await canal.send({ content: `🎉 ¡Felicidades ${ganadoresMencion.join(', ')}! Has ganado **${data.premio}**.` });
        } else {
            await canal.send({ content: `❌ El sorteo de **${data.premio}** finalizó sin ganadores debido a la falta de participantes.` });
        }

        giveawaysMap.delete(messageId);

    } catch (e) {
        console.error('Error al finalizar el sorteo:', e);
    }
}

// ======================================================
// LOGIN DEL BOT
// ======================================================

client.login(TOKEN);