import { Message, MessageEmbed } from 'discord.js';
import { capitalize } from 'tsuki-utilities';
import { palette } from '../utils/constants';
import { Command } from 'discord-akairo';
import Pepal from '../structure/pepal';
import { DateTime } from 'luxon';

// -------------------------------------------------- \\

export default class TimeTableCommand extends Command {
	constructor() {
		super('timetable', {
			aliases: ['edt', 'emploi'],
			args: [
				{
					id: 'option',
					type: [
						"aujourd'hui",
						'aujourdhui',
						'jour',
						'maintenant',
						'prochain',
						'demain'
					],
					default: 'jour'
				}
			]
		});
	}

	async exec(
		message: Message,
		{
			option
		}: {
			option:
				| "aujourd'hui"
				| 'aujourdhui'
				| 'jour'
				| 'maintenant'
				| 'prochain'
				| 'demain';
		}
	): Promise<Message> {
		const pepal = await Pepal.init(message.author.id);
		await pepal.getTimeTable();

		const todayDateTime = DateTime.local().setZone('Europe/Paris'),
			futureLessons = pepal.timeTable.filter(
				(lesson) => todayDateTime.toMillis() < +lesson.start
			);

		if (!futureLessons.length)
			return message.reply(
				"Il n'y a plus de cours ! Bonnes vacances ; on se revoit l'année prochaine."
			);

		const embed = new MessageEmbed()
			.setColor(palette.success)
			.setURL('https://www.pepal.eu/?my=edt');
		if (this.client.user && this.client.user.avatarURL())
			embed.setThumbnail(this.client.user.avatarURL() as string);

		async function buildFields(array: typeof futureLessons): Promise<void> {
			array.sort((a, b) => +a.start - +b.start);
			if (array.length === 1) {
				const relativeTime = capitalize(
					DateTime.fromJSDate(array[0].start).toRelative({
						locale: 'fr'
					}) as string
				);
				embed.setDescription(
					relativeTime +
						` pendant ${
							array[0].end.getHours() - array[0].start.getHours()
						} heures`
				);

				embed.addField('Matière', array[0].discipline, true);
				if (array[0].room) embed.addField('Salle', array[0].room, true);
				if (array[0].professor)
					embed.addField('Intervenant', array[0].professor, true);
			} else
				for (const lesson of array.values()) {
					const relativeTime = capitalize(
						DateTime.fromJSDate(lesson.start).toRelative({
							locale: 'fr'
						}) as string
					);
					embed.addField(
						DateTime.fromJSDate(lesson.start).get('hour') < 12
							? 'Matin'
							: 'Après-midi',
						`**Matière** : ${lesson.discipline}
						${
							lesson.professor ? `**Intervenant** : ${lesson.professor}\n` : ''
						}**Salle** : ${lesson.room}
						${
							relativeTime +
							` pendant ${
								lesson.end.getHours() - lesson.start.getHours()
							} heures`
						}`,
						true
					);
				}
		}

		switch (option) {
			case "aujourd'hui":
			case 'aujourdhui':
			case 'jour':
				const lessonsToday = pepal.timeTable.filter((lesson) => {
					const lessonDateTime = DateTime.fromJSDate(lesson.start);
					return (
						lessonDateTime.get('month') === todayDateTime.get('month') &&
						lessonDateTime.get('day') === todayDateTime.get('day')
					);
				});

				if (!lessonsToday.length)
					return await message.reply({
						content: "Vous n'avez pas cours aujourd'hui !",
						allowedMentions: { repliedUser: false }
					});

				embed.setTitle("Cours aujourd'hui");
				buildFields(lessonsToday);
				break;
			case 'maintenant':
			case 'prochain':
				const nextLesson = pepal.timeTable.filter((lesson) => {
					const lessonDateTime = DateTime.fromJSDate(lesson.start);
					return (
						lessonDateTime.get('month') === todayDateTime.get('month') &&
						lessonDateTime.get('day') === todayDateTime.get('day')
					);
				})[0];

				if (!nextLesson)
					return await message.reply({
						content: "Vous n'avez plus cours de la journée !",
						allowedMentions: { repliedUser: false }
					});

				embed.setTitle('Prochain cours');
				buildFields([nextLesson]);
				break;
			case 'demain':
				const lessonsTomorrow = pepal.timeTable.filter(
					(lesson) =>
						DateTime.fromJSDate(lesson.start).get('month') ===
							todayDateTime.plus({ days: 1 }).get('month') &&
						DateTime.fromJSDate(lesson.start).get('day') ===
							todayDateTime.plus({ days: 1 }).get('day')
				);

				if (!lessonsTomorrow.length)
					return await message.reply({
						content: "Vous n'avez pas cours demain !",
						allowedMentions: { repliedUser: false }
					});

				embed.setTitle('Cours demain');
				buildFields(lessonsTomorrow);
		}

		return message.reply({
			embeds: [embed],
			allowedMentions: { repliedUser: false }
		});
	}
}
