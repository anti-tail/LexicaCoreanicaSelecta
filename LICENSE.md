# 出典と許諾

このサイトのデータは次の資料から作っています．우리말샘 と 한국어기초사전 は国立国語院（국립국어원）が CC BY-SA 2.0 KR で，Lee (2015) の方言データは CC BY 4.0 で公開しているものです．

| 資料 | 使った部分 | 提供元 |
| --- | --- | --- |
| 우리말샘 | 見出し・語釈，歴史情報（世紀別の形・用例・出典），方言項目（形・地域・語釈と，結ばれた現代語の項目） | 国立国語院 <https://opendict.korean.go.kr/> |
| 한국어기초사전 | 日本語・英語の対訳（見出し語訳） | 国立国語院 <https://krdict.korean.go.kr/> |
| Lee (2015) の方言データ | 半島 14 地域の方言形（方言の検索と地図．語形の多くは小倉進平『朝鮮語方言の研究』（1944）による） | Lee, Sean (2015) A Sketch of Language History in the Korean Peninsula. *PLoS ONE* 10(5): e0128448．CLDF 版 <https://github.com/lexibank/leekoreanic>（CC BY 4.0） |

- 方言地図の輪郭は Natural Earth（パブリックドメイン，<https://www.naturalearthdata.com/>）を簡略化したもの．地域の代表地点は Lexica Coreanica で定めたもので，原資料にはありません．
- Lee (2015) の語形は国際音声記号に近い転写で書かれています．これを 한글 に書き直したのと，概念を 우리말샘 の現代語の項目に結んだのは Lexica Coreanica で，原資料にはありません．
- 方言の「語群」（同じ現代語に結ばれた方言項目のまとまり．結ばれていない項目は語釈と品詞の同じもの）と，地域名の日本語・英語の表記は Lexica Coreanica でまとめたもので，原資料にはありません．
- 「用例」のページ（`corpus.html`）は，우리말샘 の歴史情報に引かれた用例を，同じ文を 1 件にまとめて全文で引けるようにしたものです（`data/u/cites.json`）．照合キー（綴りの揺れの吸収）は Lexica Coreanica のプログラムで作ったもので，原資料にはありません．
- 表記の分節化と Yale 綴り（参考）は Lexica Coreanica のプログラムで機械的に作ったもので，原資料にはありません．
- このサイトのデータ（`data/`）も CC BY-SA 2.0 KR で提供します（同一条件許諾）．利用するときは上の出典を表示してください．
  許諾の全文：<https://creativecommons.org/licenses/by-sa/2.0/kr/>
- 原資料の内容について国立国語院は本サイトの責任を負いません．誤りに気づいたら Issue でお知らせください．

プログラム（`index.html`, `site.js`, `hkey.js`, `hangulkbd.js`, `site.css`）は Lexica Coreanica プロジェクトのものです．
