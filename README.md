# 日本語で中期朝鮮語・方言を引く — Lexica Coreanica Selecta

**English:** Middle Korean and Korean dialects in English is at [`en/`](en/) (same data, English interface and English translations; the “Citations” page searches the citations in full text; the “Dialects” tab searches modern dialect forms by form, meaning or region on a map). Corrections: [CONTRIBUTING.md](CONTRIBUTING.md#english).

15–19 世紀の朝鮮語の形と用例，現代の方言形を引く検索ページです．ブラウザだけで動きます．

- 옛한글 の形（ᄆᆞᅀᆞᆷ），現代語の見出し（마음），Yale（mozom），日本語（こころ）で引けます．
- ㆍ ㅿ ㆁ ㅸ などの字母はページのボタンで入れられます．ㅁ ㆍ ㅿ ㆍ ㅁ と順に入れると ᄆᆞᅀᆞᆷ にまとまります．
- 検索欄の横の「한」で，두벌식の配列と 옛한글 の字母のキーボードを出せます．各キーに同じ位置の手元のキーを示し，「手元のキーで打つ」を入れると韓国語の入力方式なしで打てます．
- ページ上の語（用例の中の語も）を選ぶと「訳」ボタンが出て，中期・近世の形としての項目と，現代語としての日本語訳を引けます．
- 「方言」タブでは 우리말샘 の方言項目（約 2.6 万語群・11 万形）を，方言形・意味（日本語訳・英語訳・現代語の見出しと語釈）・地図で選んだ地域で引けます．
  地域は「どれかに出る」「すべてに出る」「そこにだけ出る」で絞れ，語を入れずに地域だけ選ぶとその地域の方言形を一覧にします．
  語群を開くと，同じ意味の別の地域の形が地図と地域ごとの表に並び，同じ訳を持つ別の語群や中期・近世の形へ辿れます．
- 「用例」（[`corpus.html`](corpus.html)）では，우리말샘 の歴史情報に引かれた用例（約 3 万文）を全文で引けます．照合は「時代ごとの綴りの揺れを吸収」「音節の組み方だけ吸収」「表記どおり」「正規表現」から選べ，空白で区切ると続く語節で探します．
  世紀・文献で絞り，世紀・文献ごとの数と一致した語節の内訳を示し，結果を TSV で書き出せます．形を押すとその項目へ移ります．
- 옛한글 を表示する書体（Noto Serif CJK KR の部分集合，SIL OFL）を埋め込んでいるので，スマートフォンでも読めます．
- 英語版（英語の画面，한국어기초사전 の英語訳で引く）は [`en/`](en/) にあります．
- 訳や形の対応付けの誤りは，項目の下の「誤りを報告」から Issue で知らせてください．協力者は `corrections/translations.tsv` に 1 行足して直します（手順は [CONTRIBUTING.md](CONTRIBUTING.md)）．
- データは 우리말샘 の歴史情報と方言項目（国立国語院）と 한국어기초사전 の日本語・英語対訳（国立国語院）から作っています．
  どちらも CC BY-SA 2.0 KR です．詳しくは [LICENSE.md](LICENSE.md)．

このリポジトリはサイトの書き出し結果です．元のプログラムは Lexica Coreanica（非公開）の `tools/export_site.py` です．
