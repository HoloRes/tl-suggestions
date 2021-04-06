import axios from "axios";

// eslint-disable-next-line consistent-return
export default (req, res) => {
	if (req.method !== 'POST') return res.status(400).end();

	let clips = '';
	// eslint-disable-next-line no-plusplus
	for(let i = 0; i < req.body.clips.length; i++) {
		clips += `${JSON.stringify(req.body.clips[i]).replace(/"/g, '')}${i+1 === req.body.clips.length ? '' : '\n'}`
	}

	axios.post(process.env.WEBHOOKURL, {
		username: 'Website - new suggestion',
		avatar_url: 'https://cdn.discordapp.com/attachments/593095224398577759/828950251196383232/c8b4afafc217588294e847c71356203c_1.png',
		embeds: [{
			title: req.body.clipTitle,
			description: req.body.clipDescription,
			url: req.body.videoUrl,
			fields: [
				{
					name: 'Email',
					value: req.body.email,
				},
				{
					name: 'Discord tag',
					value: req.body.discordTag,
				},
				{
					name: 'Clips',
					value: clips,
				},
				{
					name: 'Credit',
					value: req.body.wantsCredit ? req.body.creditName : 'None'
				}
			]
		}]
	}).then(() => {
		return res.status(200).end();
	}).catch(() => {
		return res.status(500).end();
	});
};
