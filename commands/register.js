const Command = require("../structures/command");

module.exports = class RegisterCommand extends Command {

	constructor(bot) {
		super(bot);
		this.help = "Register a new {{tupper}}";
		this.usage = [
			["<name> <brackets>", "Register a new {{tupper}}.\n\t<name> - the {{tupper}}'s name, for multi-word names surround this argument in single or double quotes.\n\t<brackets> - the word 'text' surrounded by any characters on one or both sides"]
		];
		this.desc = "Upload an image when using this command to quickly set that image as the avatar!\n\nExample use: `register Test >text<` - registers {{a tupper}} named 'Test' that is triggered by messages surrounded by ><\nBrackets can be anything, one sided or both. For example `text<<` and `T:text` are both valid\nNote that you can enter multi-word names by surrounding the full name in single or double quotes `'like this'` or `\"like this\"`.";
		this.cooldown = 5*1000;
		this.groupArgs = true;
	}

	async execute(ctx) {
		let {bot, msg, args, members} = ctx;
		if(!args[0]) return bot.cmds.help.execute(ctx, "register");

		//check arguments
		ctx.cooldown = 1000;
		let brackets = msg.content.slice(msg.content.indexOf(args[0], msg.content.indexOf("register")+8)+args[0].length+1).trim().split("text");
		let name = bot.sanitizeName(args[0]);
		let member = (await bot.db.query("SELECT name,brackets FROM Members WHERE user_id = $1::VARCHAR(32) AND (LOWER(name) = LOWER($2::VARCHAR(76)) OR brackets = $3)", [msg.author.id, name, brackets || []])).rows[0];
		if(!args[1]) return "Missing argument 'brackets'. Try `{{tul!}}help register` for usage details.";
		if(name.length < 1 || name.length > 76)	return "Name must be between 1 and 76 characters.";
		if(brackets.length < 2)	return "No 'text' found to detect brackets with. For the last part of your command, enter the word 'text' surrounded by any characters.\nThis determines how the bot detects if it should replace a message.";
		if(!brackets[0] && !brackets[1]) return "Need something surrounding 'text'.";
		if(member && member.name.toLowerCase() == name.toLowerCase())	return `{{Tupper}} named '${name}' under your user account already exists.`;
		if(member && member.brackets[0] == brackets[0] && member.brackets[1] == brackets[1]) return "{{Tupper}} with those brackets under your user account already exists.";
		if(members.length >= 5000) return "Maximum {{tupper}}s reached.";
		let daysOld = bot.ageOf(msg.author);
		if((daysOld < 30 && members.Length >= 500) || (daysOld < 14 && members.Length >= 100)) return "Maximum {{tupper}}s reached for your account age.";
		let avatar = msg.attachments[0] ? msg.attachments[0].url : "https://i.imgur.com/ZpijZpg.png";
		ctx.cooldown = null; //no override

		//add member
		await bot.db.members.add(msg.author.id, {name, avatarURL:avatar, brackets:brackets.slice(0, 2)});
		return {
			content: "{{Tupper}} registered!",
			embed: {
				title: name,
				description: `**Brackets:**\t${brackets[0]}text${brackets[1]}\n**Avatar URL:**\t${avatar}\n\nTry typing: \`${brackets[0]}hello${brackets[1]}\``,
				footer: {
					text: "If the brackets look wrong, try re-registering using \"quotation marks\" around the name!"
				}
			}
		};
	}
};
