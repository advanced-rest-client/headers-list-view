/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';
import {HeadersParserMixin} from '@advanced-rest-client/headers-parser-mixin/headers-parser-mixin.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-dialog-scrollable/paper-dialog-scrollable.js';
import '@polymer/paper-button/paper-button.js';
/**
 * An element that displays a list of headers.
 *
 * On double click on the list the `query-headers` event is dispatched to
 * get header definition. When information is handled by the application
 * then it dispays a dialog with header documentation.
 * Use `advanced-rest-client/arc-definitions` element to handle queries.
 *
 * The `headers` property accepts a HTTP headers string or `Headers` object
 * as defined in Fetch spec.
 *
 * ### Example
 *
 * ```html
 * <headers-list-view headers="Content-Type: application/json"></headers-list-view>
 * ```
 *
 * ### Styling
 * `<headers-list-view>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--headers-list-view` | Mixin applied to the element | `{}`
 * `--arc-font-body1` | Mixin applied to the example section in the details dialog. | `{}`
 * `--arc-font-body2` | Mixin applied to the description section in the details dialog. | `{}`
 * `--arc-font-code1` | Mixin apllied to the list | `{}`
 * `--headers-list-item-min-height` | Min height of the list item. | `20px`
 * `--arc-link` | Mixin applied to a link | `{}`
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @appliesMixin HeadersParserMixin
 * @memberof UiElements
 */
class HeadersListView extends HeadersParserMixin(PolymerElement) {
  static get template() {
    return html`
    <style>
    :host {
      display: block;
      @apply --headers-list-view;
    }

    .dialog-header-example {
      @apply --arc-font-body1;
      margin-top: 16px;
    }

    .dialog-header-desc {
      @apply --arc-font-body2;
    }

    .list-item {
      min-height: var(--headers-list-item-min-height, 20px);
      -webkit-user-select: text;
      word-break: break-all;
      @apply --arc-font-code1;
    }

    .list-item > span {
      display: inline-block;
    }

    .header-name {
      margin-right: 8px;
    }

    .auto-link {
      @apply --arc-link;
    }
    </style>
    <div class="container" on-dblclick="_displayHeaderInfo"></div>
    <paper-dialog id="headerInfo">
      <h2>[[_hdTitle]]</h2>
      <paper-dialog-scrollable>
        <section class="dialog-header-desc">[[_hdBody]]</section>
        <section class="dialog-header-example">
          <span>Example:</span>
          <span>[[_hdExample]]</span>
        </section>
      </paper-dialog-scrollable>
      <div class="buttons">
        <paper-button dialog-confirm="" autofocus="">Close</paper-button>
      </div>
    </paper-dialog>
`;
  }

  static get is() {
    return 'headers-list-view';
  }
  static get properties() {
    return {
      /**
       * A HTTP headers to display.
       */
      headers: {
        type: String,
        observer: '_headersChanged'
      },
      /**
       * Parsed headers to the array of headers.
       *
       * @type {Array<Object>}
       */
      _headers: Array,
      /**
       * Type of the header.
       * Can be either `request` or `response`.
       * It is required for displaying the help for the headers. The element
       * fires the `query-headers` event on double click which requires this
       * information to be set.
       */
      type: {
        type: String,
        value: 'response'
      },
      /**
       * Header title in the details dialog.
       */
      _hdTitle: String,
      /**
       * Header description in the details dialog.
       */
      _hdBody: String,
      /**
       * Header example in the details dialog.
       */
      _hdExample: String,
      /**
       * A regexp used to match links in headers string.
       *
       * @type {RegExp}
       */
      _linkR: {
        type: Object,
        value: function() {
          return new RegExp('(https?:\\/\\/([^" >]*))', 'gim');
        }
      }
    };
  }
  /**
   * Returns a reference to main container of the list.
   * @return {HTMLElement} List container.
   */
  get container() {
    if (!this.shadowRoot) {
      return;
    }
    if (!this.$) {
      this.$ = {};
    }
    if (!this.$.container) {
      this.$.container = this.shadowRoot.querySelector('.container');
    }
    return this.$.container;
  }

  /**
   * The list view requires to add some markup dynamically therefore it cannot
   * use Polymer's replates and binding system.
   * Heaqders list is generated manually when headers string has changed.
   *
   * @param {String} headers Headers to render
   */
  _headersChanged(headers) {
    this._clearList();
    if (!headers) {
      return;
    }
    const list = this.headersToJSON(headers);
    const markup = list.map((item) => this._getMarkup(item)).join('\n');
    this.container.innerHTML = markup;
  }
  /**
   * Clears the list of headers.
   */
  _clearList() {
    this.container.innerHTML = '';
  }
  /**
   * Creates a markup for a list item.
   * @param {Object} item Headers model item.
   * @return {String} Markup for list item.
   */
  _getMarkup(item) {
    let result = `<div class="list-item" data-name="${item.name}">`;
    result += '<span class="header-name">';
    result += item.name + ': </span>';
    result += '<span class="header-value">';
    result += this._autoLink(item.value);
    result += '</span>';
    result += '</div>';
    return result;
  }
  /**
   * Double click on header line handler.
   * Will call model for data to display.
   *
   * @param {CustomEvent} e
   */
  _displayHeaderInfo(e) {
    const path = e.composedPath();
    let target;
    while (true) {
      target = path.shift();
      if (!target) {
        return;
      }
      if (!target.dataset || !target.dataset.name) {
        continue;
      }
      break;
    }
    const header = target.dataset.name.toLowerCase();
    const headers = this._headersQueryEvent(header).headers;
    if (headers && headers.length) {
      const result = headers[0];
      this._hdTitle = result.key;
      this._hdBody = result.desc;
      this._hdExample = result.example;
      this.$.headerInfo.open();
    }
    this._analyticsEvent('Headers list', 'Display header info dialog');
  }
  /**
   * Dispatches `query-headers` custom event handled by `arc-definitions`
   * component.
   *
   * @param {String} header Header name to query
   * @return {Object} Event's detail object
   */
  _headersQueryEvent(header) {
    const ev = new CustomEvent('query-headers', {
      detail: {
        type: this.type,
        query: header
      },
      bubbles: true,
      composed: true,
      cancelable: true
    });
    this.dispatchEvent(ev);
    return ev.detail;
  }
  /**
   * Dispatches analytics event.
   * @param {String} action Event action
   * @param {String} label Event label
   */
  _analyticsEvent(action, label) {
    const e = new CustomEvent('send-analytics', {
      detail: {
        type: 'event',
        category: HeadersListView.is,
        action: action,
        label: label
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(e);
  }

  // Finds URLs in input string and adds anchors tags.
  _autoLink(input) {
    if (typeof input !== 'string') {
      return input;
    }
    const matches = input.match(this._linkR);
    input = input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (!matches) {
      return input;
    }
    let index = input.indexOf(matches[0]);
    let result = input.substr(0, index);
    result += '<a target="_blank" class="auto-link" href="';
    result += matches[0];
    result += '">';
    result += matches[0];
    result += '</a>';
    index += matches[0].length;
    result += input.substr(index);
    return result;
  }
}
window.customElements.define(HeadersListView.is, HeadersListView);
