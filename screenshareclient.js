// Check for Circuit support
if (typeof Circuit === 'undefined') {
    $errorMessage.textContent = "Could not load SDK (circuit.js).";
    $errorMessage.style.display = 'block';
} else if (!Circuit.isCompatible()) {
    $errorMessage.textContent = "Sorry, your browser is not supported. Chrome works :)";
    $errorMessage.style.display = 'block';
}

// Display Circuit JS SDK logs in the console
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Debug);

var _client;
var _localUser;
// var _convId = '4d2e1199-ba3d-4f97-964e-7d1531c59c95'; // Conversation Samantha Unify and Samantha Google
var _convId = '68949b94-402e-430c-82d4-cfc6503065a0';
var _calls = {};

var $localVideo = document.getElementById('localVideo');
var $localDesktop = document.getElementById('localDesktop');
var $callState = document.getElementById('callState');
var $callId = document.getElementById('callId');

function logon() {
    // const ACCESS_TOKEN = '1e6d8b9bff5646c7b1e85e2fd9cea273'; // Sam User
    // const ACCESS_TOKEN = '24fff8b771e54b86b2cbc16ec442ec89'; // Sam GA User
    // const ACCESS_TOKEN = '6b51c405a845484aa017ae4b392b10c9' // SAm User on githack

    const ACCESS_TOKEN = '';
    _client = new Circuit.Client({
      client_id: '4b83dfe402644d3bb921e79049198802',
      domain: 'beta.circuit.com',
      scope: 'ALL' // Asking for ALL permissions because all these examples use the same domain
    });
    
    addClientEventListeners();

    _client.logon({ accessToken: ACCESS_TOKEN }).then(function (user) {
        _localUser = user;
    });
}

function addClientEventListeners()
{
    if (_client) {
        Circuit.supportedEvents.forEach(e => {
            _client.addEventListener(e, evt => console.log(`${e} - ${evt.reason}`))
        })
        
        _client.addEventListener('connectionStateChanged', function onConnectionStateChanged(evt) {
            console.log('Received connectionStateChanged event - state = ', evt.state)
            // $logonState.textContent = evt.state;
            if (evt.state === Circuit.Enums.ConnectionState.Disconnected) {
                // resetCallUI();
            }
        });

        _client.addEventListener('callStatus', function (evt) {
            var call = _calls[evt.call.convId];
            if (!call || call.callId === evt.call.callId) {
                console.log('Received callStatus event. state: ' + evt.call.state + ', reason: ' + evt.reason, evt.call);
                _calls[evt.call.convId] = evt.call;
                //updateList(evt.call);
                setCallUI();
            }
        });

        _client.addEventListener('callIncoming', function (evt) {
            console.log('Received callIncoming event. state: ' + evt.call.state, evt.call);
            if (_calls[evt.call.convId]) {
                console.log('Already on a call. Ignore event.');
                return;
            }
            // Automatically answer the call with audio
            var mediaType = {audio: true, video: false};
            _client.answerCall(evt.call.callId, mediaType).then(() => {
                _calls[evt.call.convId] = evt.call;
                //updateList(evt.call);
                setCallUI();
                console.log('Call has been answered')
            }).catch(err => {
                console.log('Failed to answer call. ', err)
            });
        });

        _client.addEventListener('callEnded', function (evt) {
            var call = _calls[evt.call.convId];
            if (call && call.callId === evt.call.callId) {
                console.log('Received callEnded event. state: ' + evt.call.state, evt.call);
                delete _calls[evt.call.convId];
                // updateList(evt.call);
                // resetCallUI();
            }
        });

        _client.addEventListener('conversationUpdated', function (evt) {
            var conv = evt.conversation;
            if (!_conversations[conv.convId]) {
                _conversations[conv.convId] = conv;
                if (conv.type !== 'DIRECT') {
                    $convList.options[$convList.options.length] = new Option(conv.title, conv.convId);
                }
            }
        });

        _client.addEventListener('itemAdded', function (evt) {
            var item = evt.item;
            if (item.rtc && item.rtc.type === 'ENDED' && item.attachments && item.attachments.length) {
                console.log('Received itemAdded event with a recording');
            }
        });

        _client.addEventListener('itemUpdated', function (evt) {
            var item = evt.item;
            if (item.rtc && item.rtc.type === 'ENDED' && item.attachments && item.attachments.length) {
                console.log('Received itemUpdated event with a recording');
                // $download.style.display = 'block';
                // $download.href = item.attachments[0].url;
            } else {
                // $download.style.display = 'none';
            }
        });
    }
}

function setCallUI() {
    updateButtons();
    var call = _calls[_convId];
    
    $callState.textContent = call.state;
    $callId.textContent = call.callId;
    
    // Set local video and desktop streams
    $localVideo.srcObject = call.localVideoStream;
    // or $localVideo.srcObject = call.localStreams.video;
    $localDesktop.srcObject = call.localStreams && call.localStreams.desktop;
}

function startScreenshare()
{
    _client.toggleScreenShare(_calls[_convId].callId)
    .then(function () {
        console.log('Screenshare was successfully toggled');
    }).catch(function (err) {
        console.error('Failed to toggle screenshare. ', err);
    });
}

function updateButtons()
{
    
}

function start()
{
    if (!_client || !_localUser) { return alert('Caller is not logged in'); }

    var mediaType = {audio: true, video: true};
    var selectedConvId = _convId;

    _client.startConference(selectedConvId, mediaType)
    .then(setCallUI)
    // .then(startScreenshare)
    .catch(function (err) {
        alert('Error starting conference. ' + err);
        console.error(err);
    });
    setTimeout(startScreenshare, 5000);
}

function stop() {
    if (!_client || !_localUser) { return alert('Caller is not logged in'); }
    var call = _calls[_convId];
    _client.leaveConference(call.callId);
  }

logon();