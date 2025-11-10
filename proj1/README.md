Ten folder zawiera mój pierwszy projekt na Wprowadzenie do Aplikacji Internetowych 2025/2026.

"Charlee" to mini-czacik peer-to-peer napisany w czystym HTML/CSS/JS, oprócz pomocy PeerJS do obsługi połączeń i anime.js do obsługi (być może zbędnych) animacji. Obie te biblioteki są zaciągane na frontendzie z cdn.

Jako że jest to w pełni statyczna apka, teoretycznie wystarczy otworzyć `index.html` w przeglądarce. Ja osobiście wolę [serve](https://github.com/vercel/serve). Ponadto, można rozszerzyć / ulepszyć działanie na dwa sposoby:

- Na stronie "about this" / faq.html widnieje forma do "kontaktu". Przycisk submit wykonuje POSTa na localhost:6969/notification --- w folderze server/ jest kod, który po wykonaniu `npm install && npm serve` będzie prowizorycznie przyjmował te POSTy (przy pomocy kolejnej niewspomnianej zależności, expressa) i wyświetlał je w konsoli, dla dodania realizmu.

- Peerowie są domyślnie tworzeni na publicznej instancji serwera PeerJS (0.peerjs.com). Można też łatwo odpalić swój serwer, a Charlee skorzysta z niego:
```
npx peerjs --port 9000 --key peerjs --path /myapp
```
