const socket = io("http://localhost:8000");

const form = document.getElementById("send-container");
const messageInput = document.getElementById("messageInp");
const messageContainer = document.querySelector(".container");
let onlineElement = document.querySelector(".online-members");
let audio = new Audio('res/ting.wav');
let messageTrack = [];
let synth = window.speechSynthesis;

let voiceList = document.querySelector('#voiceBoxId');
let voices = [];

let settingsNameBox = document.getElementById("nameBoxId");
let settingsSaveBtn = document.getElementById("saveSettings");

PopulateVoices();
if (speechSynthesis !== undefined) {
    speechSynthesis.onvoiceschanged = PopulateVoices;
}

function PopulateVoices() {
    voices = synth.getVoices();
    var selectedIndex = voiceList.selectedIndex < 0 ? 0 : voiceList.selectedIndex;
    voiceList.innerHTML = '';
    voices.forEach((voice) => {
        var listItem = document.createElement('option');
        listItem.textContent = voice.name;
        listItem.setAttribute('data-lang', voice.lang);
        listItem.setAttribute('data-name', voice.name);
        voiceList.appendChild(listItem);
    });
    
    voiceList.selectedIndex = selectedIndex;
}

const append = (message, position)=>{
	const messageElement = document.createElement("div");
	messageElement.innerText = message;
	messageElement.classList.add("message");
	messageElement.classList.add(position);
	messageContainer.append(messageElement);
	if (position == 'left') {
		audio.play();
	}
}

const appendAudio = (toSpeak, message, position)=>{
	const messageElement = document.createElement("div");
	messageElement.innerText = message;
	messageElement.classList.add("message");
	messageElement.classList.add(position);
	messageElement.classList.add("audioMessage");
	messageElement.id = toSpeak;
	messageContainer.append(messageElement);
	if (position == 'left') {
		audio.play();
	}
	messageTrack.push(toSpeak);
}

const updateOnline = (arr)=> {
	onlineElement.innerHTML = `<h1 class="online-head">Online Members</h1>`;
	for (let i = 0; i < arr.length; i++) {
		onlineElement.innerHTML += `<h2 class="online-list">${arr[i]}</h2>`;
	}
}

form.addEventListener("submit", (e)=>{
	e.preventDefault();
	// cbState - check button state
	const cbState = document.getElementById("sendAudioCheckbox").checked;
	const message = messageInput.value;

	if (cbState) {
		appendAudio(message, "You sent an audio. Click to listen", 'right');
	} else {
		append(message, 'right');
	}
	socket.emit("send", [message, cbState]);

	messageInput.value = "";
})

document.body.addEventListener("click", function(e) {
	let target = e.target;
	let text = "";
	for (let i = 0; i <= messageTrack.length; i++) {
		if (messageTrack[i] == target.id && target.className.includes("audioMessage")) {
			text = target.id;

		    let toSpeak = new SpeechSynthesisUtterance(text);
			let selectedVoiceName = voiceList.selectedOptions[0].getAttribute('data-name');
            voices.forEach((voice)=>{
                if(voice.name === selectedVoiceName){
                    toSpeak.voice = voice;
                }
            });
			synth.speak(toSpeak);
			break;
		}
	}
});

settingsSaveBtn.addEventListener("click", function(e) {
	socket.emit("user-changed-name", settingsNameBox.value);
});

socket.on("changed-name", data => {
	if (data.newName != data.oldName) {
		append(`${data.oldName} changed his name to ${data.newName}`, 'left');
		updateOnline(data.users);
		socket.emit("send-users-array", name);
	}
});

let name = '';
while (name == '' || name == null) {
	name = prompt("Enter your name");
}
append(`You joined as ${name}`, 'left');

settingsNameBox.value = name; // to add their name in settings text box by default

socket.emit("new-user-joined", name);

socket.on('user-joined', data => {
	append(`${data.name} joined the chat`, 'left');
	updateOnline(data.users);
	socket.emit("send-users-array", name);
});

socket.on("sending-users-array", data => {
	updateOnline(data.users);
});

socket.on('receive', data => {
	if (data.message[1]) {
		appendAudio(data.message[0], `${data.name} sent an audio. Click to listen`, 'left');
	} else {
		append(`${data.name} Sent:\n\n${data.message[0]}`, 'left');
	}
});

socket.on('left', data =>{
	append(`${data.name} left the chat`, 'left');
	updateOnline(data.users);
});