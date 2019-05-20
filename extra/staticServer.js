// 모듈을 추출합니다.
const express = require('express');
const path = require('path');
const serverPathConfig = require('./config/server.config');

// 서버를 생성합니다.
const app = express();

app.use(express.static('dist'));
app.use(serverPathConfig.dev.assetsNodeModules, express.static(path.join(__dirname, '/node_modules')));
app.use(serverPathConfig.dev.assetsFavicon, express.static(path.join(__dirname, '/favicons')));

// request 이벤트 리스너를 설정합니다.
app.get('*', (request, response) => {
    response.send(404);
    response.send('해당 경로에는 아무것도 없습니다.');
});
// 서버를 실행합니다.
app.listen(52273, () => {
    console.log('Server running at http://127.0.0.1:52273');
});
