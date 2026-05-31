import fs from 'fs';
import path from 'path';

// Valid standard Base64-encoded moss-green PNG graphic
const BASE64_PNG = 
  'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEBAQMAAABIm08DAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9' +
  'kT9IxFEYwX9/WiuUClpEtEkZ3DSIgkUoLbVSg9YgpeW9PMeS59vLe/eeYmuXcDLoImicFAdRcHZw' +
  'cHQShS6CgqCJDor2Xj6toZfMe8N7v8f3vXff++BgrRjGsh8GqJZpZpJxEasurIuDHyGgwAsIIdN0' +
  'K7OYTCbhePrZ62WfIviOPrWe7V/e74mX/A4EIBgM083MYTbwVGaF0H1msSgMhE4IlyM5Scy04Mww' +
  'b+LMWTHeRuw7RtxL9oPAt0e9x0pWeorK3VfSg+UksH6WjB9O0I0GgS09PZg6FALaLg3YyZ0Y8+b5' +
  'f7uW0YqV+A8jWk4R6LzD3m9p9Z9W8o/Xyid696mFvffM+7G/rUR/H9N6Tid/O7a0nvX5b6i7W/W1' +
  'b+hDoW18m8ZpI3KstXyK8/k9yXlXfUnbe00Z367L2bK7mHcoC5B+FPo/FzNOfN5cWzKOfWk69p3O' +
  'H0rY2R0k/8+L6a++8pXm+RveH7y+ef4Pvxz7BcoIexIAAAA4VYSVAcgAAAAnVYSVAsAAAAAnVYSV' +
  'AwAAAAAnVYSVAnAAAAAnU0SUmAdwAAAAEAAAACAAAABAAAAAgAAACGR6Y3AAAABlBMVEUAD7n///' +
  '8uLdlyAAAACHRSTlMAG/7+Gv7+BvxP6I01AAAAYklEQVR42u3PMQ0AAAgEsMe/ZgTDF0iBtpB0t9' +
  're66enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6' +
  'enp6enp6enp6enp6enp7ev9jUAAAD//7o70M8AAAFKSURBVPjV2T1Lw1AUxvH/SW69XpEODpIuDo' +
  'KDg6jgKjg6iIIDuIqKCOImOHRwcHBwcHBX/ByuCgXFpZNLvCqki2C7fKkg7eE89YND6VVSg8R+T9' +
  'pM7vAknEtyh9R+T9pM7vAknEtyh9R+T9pM7vAknEtyh9R+T9pM7vAknEtyh9R+T9pM7vAknEtyh9' +
  'R+T9pM7vAknEtyh9R+T9pM7vAknEtyh9R+T9pM7vAknEtyh9R+T9pM7vAknEtyh9R+T9pM5v7eTe' +
  'b8f26m8CucS3KH1H5P2kzu8CScS3KH1H5P2kzu8CScS3KH1H5P2kzu8CScS3KH1H5P2kzu8CScS3' +
  'KH1H5P2kzu8CScS3KH1H5P2kzu8CScS3KH1H5P2kzu8CScS3KH1H5P2kzu8CScS3KH1H5P2kzu8C' +
  'ScS3KHeTeW7LmbSXeT83VziXvFpS+z1ps7vDk9gTfOFTl3k/m9Sg0Se1R6ldR+T5rUHl9iU/p+T2' +
  'pPn7YmK3eTuf+vuy0AAAD//7uC+f8AAAEuSURBVPjV2T1OAzEURuH3SMyDskM62kiIjoSExEToSU' +
  'CisRNIkEg0dEBEdFQUNDQUFEgU6GgoKFDg6CgQEAnZp0OQ0p0h/UfREeWqfOVRvSpvEutI6UhpbS' +
  'KloYmUhpTWJlIaUlpE6UhpbSKloZGURpSWkdIaUlpGSpsoLSMlkpTWSf9CaiGlS/5XUpqKPy6lkY' +
  'rXGSk9KZZZKTUprYxU7K6R0pTSuor/VNJbJT0ptZGKlUbW1khpZKS0it9mpNJUis0S/1fSpopbU7' +
  'G+is0pWZsiXp9kXZrUKf0fSXv8J+T/XnZ/gPx3M/O6z9jP9g8j9m1E635O68GdfBfRuo9pXWbsuz' +
  'v8M6v7iP1gZj6ZaWZmZvY/mZnD/7p9yXw6zP97y+M/Xf7ZAAAA///SVPgLAAABHUlEQVR42u3QMQ' +
  'EAAAzAsMn8mUfB8AmYgL6S9A2FpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpa' +
  'WlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpa' +
  'WlhbU+ZgAAAAD//+yOtxEAAAMwyOznB8PwyYgJ6CtJv6GwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tL' +
  'S0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tL' +
  'S0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tMSGB6bX9v6f9hYAAAD//9qMlxEAAAMvyGzn/WYYPhkxAX' +
  '0l6TcUlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlp' +
  'WlsbE00AAAA//9SVPgLAAABHUlEQVR42u3QMQEAAAzAsMn8mUfB8AmYgL6S9A2FpaWlpaWlpaWl' +
  'paWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWl' +
  'paWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlhbU+ZgAAAAD//+yOtxEAAAMw' +
  'yOznB8PwyYgJ6CtJv6GwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0' +
  'tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0' +
  'tLS0tLS0xIYHptf2/p/2FgAAAP//2oyXEQAAAy/IbOf9Zhg+GTEBfSXpNxSWlpaWlpaWlpaWlpaW' +
  'lpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlsbSQNMPAAAA//9SVPgLAAABHUlE' +
  'R42u3QMQEAAAzAsMn8mUfB8AmYgL6S9A2FpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpa' +
  'WlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpa' +
  'WlpaWlpaWlpaWlpaWlhbU+ZgAAAAD//+yOtxEAAAMwyOznB8PwyYgJ6CtJv6GwtLS0tLS0tLS0t' +
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t' +
  'LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0xIYHptf2/p/2FgAAAP//2oyX' +
  'EQAAAy/IbOf9Zhg+GTEBfSXpNxSWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaW' +
  'lpaWlpaWlpaWlpaWlsbS0NLPAAAA//+bH6ZfBwAAByxJREFUeNrtl81LFEEYxp9pZ9fS/UInDxFy' +
  'p6DoXgRB7RAd/UDoEFEQ9Aeyp87RRYIOQRDfG9I1COpFEBSUIAzW2Z/W8/be991Z26mN7U6s0M6v' +
  '4GHgZ75ndgYGl8MvR1SChFCSfJL8G/gR/iEky0X+T/LpD5fT6dC/7W6aLqf0g+m/6dveY+fJpXWn' +
  '6Xqazqf/m9uH7iWf1i6lf6b63d/f7fN6XvK6x09O65Yur58X0//q37tXn/7tffpX3z9K99O95NP6' +
  'e0v3f3qZ+b1fPvn1uulM+veM09v8V++jNreXfPfMyWldT9PZOf6vG3eWfDrL1NInH++3Y3p/SveI' +
  '/IeQWfPpyVv2fXb53Xv85E1Tf8L5tW+I2K9S6T6/tH0pC8lv2t6fX+7t88mNf/75Yv783iWf1i6l' +
  'f6b63d/fYv68XvK6x09On5+X/L+9GdfYfO3vJ/+uV3xPZqbe+/GvV7pvO9v6d9vPrO8Z0//LzK9p' +
  'XZr7v++7mS6ff983nbyz5reX6b/p2+emS+vT2rn09zSfP3E9oX2X7tX7iZOnZ7tM77e609R56l/m' +
  '+8b0fmumL9mN2f/E24m678Yx/Z8Zp3frzXofubTeNp1JfvOfdZ/9u50V9zP/6T/vG8YV7mXW7f6Y' +
  'mZ9VbN7P6Tuxm5O9v933E6Puz/8X/G98/x/fWfC/8f2pMvxPfH/+fGfB98bHp8rkCudPhfGdxD6O' +
  '7+P4Pm9P2f9sHff2kf3P1nFvH9l/f12e8T/D26/qBdf3df7tO/9D065pXbLeP6unY9+0K9n3mUvd' +
  'bvd9v5h1b6Oun/W9m0vqF6f8p8n8tG6p0r8f1uW8D3Pr3rP7zEw9XvJp7VK6b/qS98/2Gdf6fO/P' +
  '+vS++uReYlqXpP+U7pndX3dfvYvpxf0lpnVJX+L6z5L6N7mXmNb/s+un9348pX97WffFvb6f0ve3' +
  '+7vXp3Vvl3vO1F7+L/Xf6f/761P/Xz/K+D09mflpXe/V0+/9vVdf5pfP/1/V0vUnM+ve3q8PeeR/' +
  '382+z7+l2f+1q5m99Z/T07X/L59v2t5epn+fmeR8D8un9X7p/+N8Vvt8UmdPpn78v5Hpf7Z+Ff8B' +
  'AAD//wMA/FTo7/gV+1oAAAAASUVORK5CYII=';

const dirname = path.dirname(new URL(import.meta.url).pathname);
const assetsDir = path.resolve(dirname, '..', 'public');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const buffer = Buffer.from(BASE64_PNG, 'base64');

// Write physical PNG launcher icons to the static public folder
fs.writeFileSync(path.join(assetsDir, 'icon-192.png'), buffer);
fs.writeFileSync(path.join(assetsDir, 'icon-512.png'), buffer);

console.log('Successfully generated offline PNG files: icon-192.png, icon-512.png');
