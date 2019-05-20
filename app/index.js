import './index.scss';
import EmptyChat from './components/EmptyChat.vue';
import MessageChat from './components/MessageChat.vue';
import FormChat from './components/FormChat.vue';

const Vue = require('vue');
const Moment = require('moment');
const firebase = require('firebase');

var firebaseConfig = {
   apiKey: "AIzaSyB3438PASbpI2RGJ9wpcReD5lhVUYdP2tI",
   authDomain: "vuejs-socketio-10bc5.firebaseapp.com",
   databaseURL: "https://vuejs-socketio-10bc5.firebaseio.com",
   projectId: "vuejs-socketio-10bc5",
   storageBucket: "vuejs-socketio-10bc5.appspot.com",
   messagingSenderId: "543090791899",
   appId: "1:543090791899:web:a4dad3a51cbe7e3a"
 };

var settingsConfig = {
  serverPort: 9002,
  numberMessageLoaded: 3,
  dbChatRef: '/chat',
};

const pageTitle = document.title;

firebase.initializeApp(firebaseConfig);
const messagesDbRef = firebase.database().ref(settingsConfig.dbChatRef);
let snapshotValue;
let bulkMessage = [];
let [user, name, pict, msg, time] = [];

let userData = null;

const getCookie = (cname) => {
  const name = `${cname}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i += 1) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
};

// CHAT
const VueChat = new Vue({
  el: '#chat',
  data: {
    loading: true,
    messages: [],
    form: '',
    input: '',
    user: null,
  },
  components: {
    'empty-chat': EmptyChat,
    'message-chat': MessageChat,
    'form-chat': FormChat,
  },
  methods: {
    keySubmit: (message, $event) => {
      if ($event.keyCode === 13 && !$event.shiftKey)
        sendMessage(message, $event);
    },
    clickSubmit: (message, $event) => {
      sendMessage(message, $event);
    },
    login: () => {
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
          const provider = new firebase.auth.GithubAuthProvider();
          provider.addScope('read:user');
          return firebase.auth().signInWithPopup(provider);
        })
        .then((result) => {
          if (result && result.user && result.additionalUserInfo) {
            document.cookie = `githubAccessToken=${result.credential.accessToken}`;
            userData = {
              userName: result.additionalUserInfo.username,
              displayName: result.user.displayName,
              userPict: result.user.photoURL,
            };
            VueChat.user = userData;
          }
        })
        .catch((error) => {
          console.error('ERROR', error); // eslint-disable-line
          VueChat.user = null;
        });
    },
  },
  mounted() {
    const token = getCookie('githubAccessToken');
    if (token) {
      const credential = firebase.auth.GithubAuthProvider.credential(token);
      var credential2 = JSON.stringify(credential,null,4);
      firebase.auth().signInAndRetrieveDataWithCredential(credential)
        .then((result) => {
          if (result && result.user && result.additionalUserInfo) {
            userData = {
              userName: result.additionalUserInfo.username,
              displayName: result.user.displayName,
              userPict: result.user.photoURL,
            };
            VueChat.user = userData;
            VueChat.loading = false;


            messagesDbRef.orderByChild('time').on('value', (snapshot) => {
              snapshotValue = snapshot.val();
              if (snapshotValue) {
                bulkMessage = [];
                Object.keys(snapshotValue).forEach((key) => {
                  bulkMessage.push({
                    user: snapshotValue[key].user,
                    name: snapshotValue[key].name,
                    pict: snapshotValue[key].pict,
                    message: snapshotValue[key].msg,
                    time: snapshotValue[key].time,
                  });
                });
                addBulkMessage(bulkMessage);
                console.log(JSON.stringify(bulkMessage));
              }
            });


          }
        })
        .catch((error) => {
          console.error('ERROR', error); // eslint-disable-line
          VueChat.user = null;
          VueChat.loading = false;
        });
    } else {
      this.user = null;
      this.loading = false;
    }
  },
});

const sendMessage = (message, $event) => {
  $event.preventDefault();
  if (VueChat.user && message && message.trim()) {
    [user, name, pict, msg, time] = [
      VueChat.user.userName,
      VueChat.user.displayName,
      VueChat.user.userPict,
      message,
      new Date().getTime(),
    ];
    firebase.database().ref(settingsConfig.dbChatRef).push({
      user,
      name,
      pict,
      msg,
      time,
    });
    firebase.database().ref(`/users/${user}/messages`).push({
      msg,
      time,
    });

    VueChat.$children.forEach((value) => {
      Object.assign(value, { inputBind: null });
    });
  }
}

const addBulkMessage = (bulkMessage) => {
  bulkMessage.forEach((value, key) => {
    Object.assign(bulkMessage[key], {
      time: new Moment(value.time).format('DD/MM/YYYY - HH:mm').toString(),
    });
  });
  VueChat.messages = bulkMessage;
};

function onBlur() {
  document.title = 'I miss you :(';
}

function onFocus() {
  document.title = pageTitle;
}

if ( /* @cc_on!@ */ false) { // check for Internet Explorer
  document.onfocusin = onFocus;
  document.onfocusout = onBlur;
} else {
  window.onfocus = onFocus;
  window.onblur = onBlur;
}
