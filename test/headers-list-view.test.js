import { fixture, assert, nextFrame } from '@open-wc/testing';
import sinon from 'sinon/pkg/sinon-esm.js';
import { middleOfNode, makeMouseEvent } from '@polymer/iron-test-helpers/mock-interactions.js';
import '@advanced-rest-client/arc-definitions/arc-definitions.js';
import '../headers-list-view.js';

import { chai } from '@bundled-es-modules/chai';
import { chaiDomDiff } from '@open-wc/semantic-dom-diff';

chai.use(chaiDomDiff);

describe('<headers-list-view>', function() {
  async function basicFixture() {
    return (await fixture(`<headers-list-view></headers-list-view>`));
  }

  async function definitionsFixture() {
    return (await fixture(`<div>
        <headers-list-view></headers-list-view>
        <arc-definitions></arc-definitions>
      </div>`));
  }

  describe('hetters and setters', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('headers are undefined by default', () => {
      assert.isUndefined(element.headers);
    });

    it('headers getter has the same headers', () => {
      const headers = 'content-type: application/json';
      element.headers = headers;
      assert.equal(element.headers, headers);
    });

    it('headers setter calles headersToJSON()', () => {
      const spy = sinon.spy(element, 'headersToJSON');
      const headers = 'content-type: application/json';
      element.headers = headers;
      assert.equal(spy.args[0][0], headers);
    });

    it('headers setter won\'t call headersToJSON() when the same headers', () => {
      const headers = 'content-type: application/json';
      element.headers = headers;
      const spy = sinon.spy(element, 'headersToJSON');
      element.headers = headers;
      assert.isFalse(spy.called);
    });

    it('clears _headersList when setting undefined', () => {
      const headers = 'content-type: application/json';
      element.headers = headers;
      assert.lengthOf(element._headersList, 1);
      element.headers = undefined;
      assert.isUndefined(element._headersList);
    });
  });

  describe('_displayHeaderInfo()', () => {
    let element;
    beforeEach(async () => {
      const region = await definitionsFixture();
      element = region.querySelector('headers-list-view');
      element.headers = 'content-type: application/json\nx-test: true';
      await nextFrame();
    });

    it('opens header dialog', () => {
      const item = element.shadowRoot.querySelector('.container .list-item');
      const xy = middleOfNode(item);
      makeMouseEvent('dblclick', xy, item);

      const node = element.shadowRoot.querySelector('paper-dialog');
      assert.isTrue(node.opened);
    });

    it('won\'t open header dialog for unknown header', () => {
      const item = element.shadowRoot.querySelectorAll('.container .list-item')[1];
      const xy = middleOfNode(item);
      makeMouseEvent('dblclick', xy, item);

      const node = element.shadowRoot.querySelector('paper-dialog');
      assert.isFalse(node.opened);
    });

    it('dispatches query-headers event', function() {
      const spy = sinon.spy();
      element.addEventListener('query-headers', spy);
      const item = element.shadowRoot.querySelector('.container .list-item');
      const xy = middleOfNode(item);
      makeMouseEvent('dblclick', xy, item);

      const result = spy.args[0][0].detail;
      assert.equal(result.query, 'content-type');
      assert.equal(result.type, 'response');
    });

    it('ignores double clik on unknown item', () => {
      const spy = sinon.spy();
      element.addEventListener('query-headers', spy);
      const item = element.shadowRoot.querySelector('.container');
      const xy = middleOfNode(item);
      makeMouseEvent('dblclick', xy, item);
      assert.isFalse(spy.called);
    });
  });

  describe('Rendering the list', () => {
    let element;
    let headers;
    beforeEach(async () => {
      element = await basicFixture();
      headers = 'Content-Type: application-json\n';
      headers += 'Content-Length: 256\n';
      headers += 'Content-Encoding: gzip';
      element.headers = headers;
      await nextFrame();
    });

    it('Renders headers list', () => {
      const result = element.shadowRoot.querySelectorAll('.container .list-item');
      assert.equal(result.length, 3);
    });

    it('Re-renders the list', async () => {
      let result = element.shadowRoot.querySelectorAll('.container .list-item');
      assert.equal(result.length, 3);
      element.headers = 'accept: application/json';
      await nextFrame();
      result = element.shadowRoot.querySelectorAll('.container .list-item');
      assert.equal(result.length, 1);
    });
  });

  describe('Links discovery', () => {
    let element;
    before(async () => {
      element = await basicFixture();
    });

    it('renders a Link header', async () => {
      element.headers = 'Link: <https://example.com>; rel="preload"';
      await nextFrame();
      const node = element.shadowRoot.querySelector('.header-value');
      assert.dom.equal(node, `<span class="header-value">
        <
          <a class="auto-link" href="https://example.com" target="_blank">
            https://example.com
          </a>
        >; rel="preload"
      </span>`);
    });

    it('ignores incoplete urls', async () => {
      element.headers = 'Link: <example.com>; rel="preload"';
      await nextFrame();
      const node = element.shadowRoot.querySelector('.header-value');
      assert.dom.equal(node, `<span class="header-value">
        &lt;example.com&gt;; rel="preload"
      </span>`);
    });

    it('renders complex location value', async () => {
      const header = 'Location: <http://localhost:8080/pimexport/products?page=2>;rel="next";';
      element.headers = header;
      await nextFrame();
      const node = element.shadowRoot.querySelector('.header-value');
      assert.dom.equal(node, `<span class="header-value">
        <
          <a
            class="auto-link"
            href="http://localhost:8080/pimexport/products?page=2"
            target="_blank"
          >
            http://localhost:8080/pimexport/products?page=2
          </a>
        >;rel="next";
      </span>`);
    });
  });

  describe('a11y', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
      let headers = 'Content-Type: application-json\n';
      headers += 'Content-Length: 256\n';
      headers += 'Content-Encoding: gzip\n';
      headers += 'Location: <http://localhost:8080/pimexport/products?page=2>;rel="next";';
      element.headers = headers;
      await nextFrame();
    });

    it('is accessible', async () => {
      await assert.isAccessible(element);
    });
  });
});
