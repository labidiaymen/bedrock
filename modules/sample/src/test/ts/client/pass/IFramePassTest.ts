import { Assert, UnitTest } from '@ephox/bedrock-client';

import { sendText, sendMouse } from '../../utils/Utils';

UnitTest.asyncTest('IFrame Test', (success, failure) => {

  /*
    * This frame will get sent keyboard events to its content editable body
    */
  const iframe1 = document.createElement('iframe');
  iframe1.setAttribute('class', 'iframe-keyboard');

  /*
    * This textarea will get sent keyboard events
    */
  const textarea = document.createElement('textarea');

  /*
    * This frame will get sent mouse events to its select inside
    */
  const iframe2 = document.createElement('iframe');
  iframe2.setAttribute('class', 'iframe-mouse');

  /*
    * This button will get sent mouse events
    */
  const button = document.createElement('button');
  button.innerHTML = 'Click me';
  button.setAttribute('class', 'button-mouse');
  button.addEventListener('click', function () {
    button.style.setProperty('background', '#cadbee');
    button.setAttribute('data-clicked', 'clicked');
  });

  const loadContentIntoFrame = function (fr, content, onSuccess, onFailure) {
    const listener = function () {
      fr.removeEventListener('load', listener);
      try {
        const doc = fr.contentWindow.document;
        doc.open('text/html', 'replace');
        doc.writeln(content);
        doc.close();
      } catch (err) {
        onFailure(err);
      }

      onSuccess(fr);
    };

    fr.addEventListener('load', listener);
  };

  // Give IE a bit of lead in time.
  setTimeout(function () {

    loadContentIntoFrame(iframe1, '<! doctype><html><body contenteditable="true">!</body></html>', function (fr1) {
      loadContentIntoFrame(iframe2, '<! doctype><html><body><input id="chk" type="checkbox"><label for="chk">Check me</label></body></html>', function (fr2) {

        // IE requires focus.
        fr1.contentWindow.document.body.focus();

        sendText('.iframe-keyboard=>body', 'going')
          .then(() => sendText('textarea', 'blah'))
          .then(() => {
            Assert.eq('', 'going!', fr1.contentWindow.document.body.innerHTML.trim());
            Assert.eq('', 'blah', textarea.value);
          })
          .then(() => sendMouse('.iframe-mouse=>input', 'click'))
          .then(() => {
            Assert.eq('', true, fr2.contentWindow.document.body.querySelector('input').checked);
          })
          .then(() => sendMouse('.button-mouse', 'click'))
          .then(() => {
            Assert.eq('', 'clicked', button.getAttribute('data-clicked'));

            document.body.removeChild(fr1);
            document.body.removeChild(fr2);
            document.body.removeChild(textarea);
            document.body.removeChild(button);

            success();
          })
          .catch(failure);

      }, failure);

      document.body.appendChild(iframe2);
    }, failure);

    document.body.appendChild(iframe1);
    document.body.appendChild(textarea);

    document.body.appendChild(button);
  }, 2000);

});
