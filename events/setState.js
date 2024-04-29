const {Events, ActivityType} = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        client.user.setActivity({
            name: "Discord 봇 개발",
            type: ActivityType.Playing,
        });
    },
};