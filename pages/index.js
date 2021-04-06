import {
	Paper,
	IconButton,
	Grid,
	Typography,
	Button,
	TextField,
	Checkbox,
	FormControlLabel,
	Snackbar,
} from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert'
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import ReactPlayer from "react-player";
import {useEffect, useState, useRef} from 'react';
import {createStyles, makeStyles} from '@material-ui/core/styles';
import axios from "axios";

const useStyles = makeStyles(theme =>
	createStyles({
		root: {
			paddingTop: theme.spacing(4),
			textAlign: 'center',
		},
	})
);

function Alert(props) {
	return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export default function Home() {
	const classes = useStyles({});

	const [clipTitle, setClipTitle] = useState('');
	const [clipDescription, setClipDescription] = useState('');

	const [email, setEmail] = useState('');
	const [discordTag, setDiscordTag] = useState('');
	const [wantsCredit, setWantsCredit] = useState(false);
	const [creditName, setCreditName] = useState('');

	const [clips, setClips] = useState([]);
	const [clipsHtml, setClipsHtml] = useState([]);

	const [currentClip, setCurrentClip] = useState([]);

	const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=vQHVGXdcqEQ');

	const [inVidClippingAvailable, setInVidClippingAvailable] = useState(false);
	const [addClipAvailable, setAddClipAvailable] = useState(false);

	const [allTimestampsValid, setAllTimeStampsValid] = useState(true);

	const [alertOpen, setAlertOpen] = useState(false);
	const [alertSeverity, setAlertSeverity] = useState('');
	const [alertMessage, setAlertMessage] = useState('');
	const [alertAction, setAlertAction] = useState(<></>);

	const playerRef = useRef(null);

	function secondParser(hms) {
		const a = hms.split(':');
		return +a[0] * 60 * 60 + +a[1] * 60 + +a[2];
	}

	function timestampParser(seconds) {
		const date = new Date(1970, 0, 1);
		date.setSeconds(seconds);
		return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
	}

	const addClip = () => setClips([...clips, [0, 0]]);

	function clearFields() {
		setClipTitle('');
		setClipDescription('');
		setEmail('');
		setDiscordTag('');
		setWantsCredit(false);
		setCreditName('');
		setClips([]);
		setClipsHtml([]);
		setCurrentClip([]);
		setVideoUrl('https://www.youtube.com/watch?v=vQHVGXdcqEQ');
		setInVidClippingAvailable(false);
		setAddClipAvailable(false);
		setAllTimeStampsValid(true);
		setAlertOpen(false);
	}

	function submit() {
		const timestamps = clips.map(clip =>
			clip.map(timestamp =>
				timestampParser(timestamp) === 'Invalid Date'
					? timestamp
					: timestampParser(timestamp)
			)
		);
		axios.post('/api/submit', {
			clipTitle,
			clipDescription,
			email: email || 'None',
			discordTag: discordTag || 'None',
			wantsCredit,
			creditName,
			clips: timestamps,
			videoUrl
		}).then(() => {
			setAlertSeverity('success');
			setAlertMessage('Suggestion submitted successfully');
			setAlertAction(null);
			setAlertOpen(true);
			clearFields();
		}).catch(() => {
			setAlertSeverity('error');
			setAlertMessage('Submission failed');
			setAlertAction(<>
				<Button color='secondary' size='small' onClick={submit}>
					Try again
				</Button>
			</>);
			setAlertOpen(true);
		});
	}

	useEffect(() => {
		setAddClipAvailable(
			clips?.length > 0
				? clips[clips.length - 1].length === 2 && ReactPlayer.canPlay(videoUrl)
				: ReactPlayer.canPlay(videoUrl)
		);
	}, [clips, videoUrl]);

	function clipTimestamp() {
		const clip = [...currentClip];
		clip.push(Math.round(playerRef?.current.getCurrentTime()));
		setCurrentClip(clip);
		if (currentClip[0]) {
			const newClips = [...clips];
			if (
				newClips.length > 0 &&
				(!newClips[newClips.length - 1][0] || !newClips[newClips.length - 1][1])
			)
				newClips.splice(newClips[newClips.length - 1], 1);
			newClips.push(clip);
			setClips(newClips);
			setCurrentClip([]);
		}
	}

	function checkInVidClippingAvailable() {
		setInVidClippingAvailable(
			ReactPlayer.canPlay(videoUrl) &&
			playerRef?.current.getCurrentTime &&
			playerRef?.current.getCurrentTime() !== null
		);
	}

	useEffect(() => {
		function removeClip(index) {
			const newClips = [...clips];
			newClips.splice(index, 1);
			setClips(newClips);
		}

		function updateTimestamp(event, index, timestamp) {
			const newClips = [...clips];
			newClips[index][timestamp] = event.target.value;
			setClips(newClips);
		}

		/* This function gives the parsed timestamp from the seconds which is saved in state or directly the state back,
			  depending on if the state is a valid one. This is needed because the in video clipping saves seconds in state and
			  not a text timestamp.
		 */
		const timestamps = clips.map(clip =>
			clip.map(timestamp =>
				timestampParser(timestamp) === 'Invalid Date'
					? timestamp
					: timestampParser(timestamp)
			)
		);

		const timestampsValid = clips.map(clip => {
			const clipTimestamps = [];

			if (timestampParser(clip[0]) === 'Invalid Date') {
				if (Number.isNaN(secondParser(clip[0]))) return false;
				clipTimestamps.push(secondParser(clip[0]));
			} else clipTimestamps.push(clip[0]);

			if (timestampParser(clip[1]) === 'Invalid Date') {
				if (Number.isNaN(secondParser(clip[1]))) return false;
				clipTimestamps.push(secondParser(clip[1]));
			} else clipTimestamps.push(clip[1]);

			/* Checks if the start timestamp is below zero, if the end timestamp is before the start timestamp
				and when possible checks if the the end timestamp is past the video duration.
			 */
			return !(
				clipTimestamps[0] < 0 ||
				clipTimestamps[1] < clipTimestamps[0] ||
				(playerRef.current.getDuration() === null
					? true
					: clipTimestamps[1] > playerRef.current.getDuration())
			);
		});
		setAllTimeStampsValid(timestampsValid.indexOf(false) === -1);

		const newHtml = clips.map((clip, index) => (
			<Grid container justify="center" alignItems="center" key={index} style={{marginBottom: '2vh'}}>
				<Typography>{index + 1}:</Typography>
				<TextField
					style={{marginLeft: '2vw'}}
					label="Start time"
					variant="outlined"
					value={timestamps[index][0]}
					error={!timestampsValid[index]}
					onChange={event => updateTimestamp(event, index, 0)}
				/>
				<TextField
					style={{marginLeft: '2vw'}}
					label="End time"
					variant="outlined"
					value={timestamps[index][1]}
					error={!timestampsValid[index]}
					onChange={event => updateTimestamp(event, index, 1)}
				/>
				<IconButton
					color="primary"
					aria-label="Delete this clip"
					component="span"
					onClick={() => removeClip(index)}
				>
					<DeleteIcon/>
				</IconButton>
			</Grid>
		));

		setClipsHtml(newHtml);
	}, [clips]);

	return (
		<div style={{
			backgroundImage: 'url(/img/background.webp)',
			margin: 0,
			padding: 0,
			left: 0,
			top: 0,
			height: '100%',
			width: '100%',
			position: 'fixed',
			overflow: 'auto'
		}}>
			<div className={classes.root}>
				<Paper elevation={3} style={{
					margin: 'auto',
					width: '75vw',
					minHeight: '95vh',
				}}>
					<Typography variant='h4' gutterBottom>
						Hololive Resort Subs - Suggestions
					</Typography>
					<Typography>
						Submit clips and we might translate them!
					</Typography>
					<Typography variant='h5' align='left' style={{marginLeft: '21vw'}}>
						Clip info
					</Typography>
					<TextField required
							   value={clipTitle}
							   label='Clip title'
							   onChange={(event) => setClipTitle(event.target.value)}
							   style={{width: '20vw', marginBottom: '2vh'}}
					/>
					<br/>
					<TextField required
							   value={clipDescription}
							   label='Tell us more about the clip!'
							   style={{width: '20vw'}}
							   rows={2}
							   multiline
							   onChange={(event) => setClipDescription(event.target.value)}
					/>
					<hr/>
					<Typography variant='h5' align='left' style={{marginLeft: '21vw'}}>
						Timestamps
					</Typography>
					<br/>
					<ReactPlayer
						url={videoUrl}
						ref={playerRef}
						onReady={checkInVidClippingAvailable}
						onClickPreview={checkInVidClippingAvailable}
						onPlay={checkInVidClippingAvailable}
						onStart={checkInVidClippingAvailable}
						light
						controls
						volume={0.5}
						style={{margin: 'auto', marginBottom: '2vh', backgroundColor: '#000'}}
					/>
					<TextField
						label="Video URL"
						variant="outlined"
						required
						value={videoUrl}
						error={!ReactPlayer.canPlay(videoUrl)}
						onChange={event => setVideoUrl(event.target.value)}
					/>
					<br/>
					<br/>
					<Button
						variant="contained"
						color="secondary"
						onClick={clipTimestamp}
						disabled={!inVidClippingAvailable}
					>
						{currentClip.length > 0 ? 'End clip' : 'Start clip'}
					</Button>
					<br/>
					<br/>
					<Typography>Clips:</Typography>
					<br/>
					<Grid item xs={12}>
						{clipsHtml}

						<IconButton
							variant="contained"
							onClick={addClip}
							color="primary"
							aria-label="Add clip"
							disabled={!addClipAvailable}
						>
							<AddIcon/>
						</IconButton>
					</Grid>

					<br/>
					<br/>

					<hr/>
					<Typography variant='h5' align='left' style={{marginLeft: '21vw'}}>
						Personal info (optional)
					</Typography>
					<Typography align='left' style={{marginLeft: '21vw'}}>
						We'll only use your details to contact you if needed.
					</Typography>
					<br/>
					<TextField
						value={email}
						label='Email address'
						variant="outlined"
						type='email'
						onChange={(event) => setEmail(event.target.value)}
						error={email.length !== 0 && !(/^\S+@\S+\.\S+$/.test(email))}
						style={{width: '20vw', marginBottom: '2vh'}}
					/>
					<br/>
					<TextField
						value={discordTag}
						label='Discord tag'
						variant="outlined"
						style={{width: '20vw'}}
						error={discordTag.length !== 0 && !(/^[\w|\s]+#[0-9]{4}$/.test(discordTag))}
						onChange={(event) => setDiscordTag(event.target.value)}
					/>
					<br/>
					<br/>
					<FormControlLabel
						control={<Checkbox checked={wantsCredit}
										   onChange={() => setWantsCredit(!wantsCredit)}/>}
						label='I would like to be credited for this submission'/>
					<br/>
					<br/>
					{wantsCredit && <TextField required
											   value={creditName}
											   label='How do you want to be referred in the credits?'
											   variant="outlined"
											   onChange={(event) => setCreditName(event.target.value)}
											   style={{width: '20vw', marginBottom: '2vh'}}
					/>}
					<br/>
					<br/>


					<Button
						variant="contained"
						color="secondary"
						onClick={submit}
						disabled={
							!(
								ReactPlayer.canPlay(videoUrl) &&
								clips.length > 0 &&
								allTimestampsValid &&
								clipTitle.length > 0 &&
								clipDescription.length > 0 &&
								(email.length > 0 ?
									/^\S+@\S+\.\S+$/.test(email) : true) &&
								(discordTag.length > 0 ?
									/^[\w|\s]+#[0-9]{4}$/.test(discordTag) : true) &&
								(wantsCredit ? creditName.length > 0 : true)
							)
						}
					>
						Submit
					</Button>
					<br/>
					<br/>
				</Paper>

				<Snackbar open={alertOpen}
						  autoHideDuration={10000}
						  onClose={(event, reason) => {
							  if (reason !== 'clickaway') setAlertOpen(false);
						  }}
				>
					<Alert onClose={(event, reason) => {
						if (reason !== 'clickaway') setAlertOpen(false);
					}}
						   action={alertAction}
						   severity={alertSeverity}
					>
						{alertMessage}
					</Alert>
				</Snackbar>
			</div>
		</div>
	);
}
