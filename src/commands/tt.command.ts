import { Message, MessageEmbed } from 'discord.js';
import { palette } from '../utils/constants';
import { Command } from 'discord-akairo';
import Pepal from '../structure/pepal';
import { DateTime } from 'luxon';

// -------------------------------------------------- \\

export default class TimeTableCommand extends Command {
	constructor() {
		super('timetable', {
			aliases: ['edt', 'emploi']
		});
	}

	async exec(message: Message): Promise<Message> {
		const pepal = await Pepal.init(message.author.id);
		await pepal.getTimeTable();

		const futureLessons = pepal.timeTable
			.filter(
				(lesson) =>
					DateTime.local().setZone('Europe/Paris').toMillis() < +lesson.start
			)
			.sort((a, b) => +a.start - +b.start);

		if (!futureLessons.length)
			return message.reply(
				"Il n'y a plus de cours ! Bonnes vacances ; on se revoit l'année prochaine."
			);

		const relativeTimeOne = DateTime.fromJSDate(
				futureLessons[0].start
			).toRelative({
				locale: 'fr'
			}),
			embed = new MessageEmbed().setColor(palette.success).addField(
				'Prochain cours',
				`**Matière** : ${futureLessons[0].discipline}
			${
				futureLessons[0].professor
					? `**Intervenant** : ${futureLessons[0].professor}\n`
					: ''
			}**Salle** : ${futureLessons[0].room}
			${
				relativeTimeOne
					? relativeTimeOne.replace(
							relativeTimeOne.charAt(0),
							relativeTimeOne.charAt(0).toUpperCase()
					  ) +
					  ` pendant ${
							futureLessons[0].end.getHours() -
							futureLessons[0].start.getHours()
					  } heures`
					: ''
			}`,
				true
			);

		if (this.client.user && this.client.user.avatarURL())
			embed.setThumbnail(this.client.user.avatarURL() as string);

		return message.reply({
			embeds: [embed],
			allowedMentions: { repliedUser: false }
		});
	}
}
