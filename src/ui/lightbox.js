/**
 * @fileoverview The lightbox class.
 */

goog.provide('treesaver.ui.LightBox');

goog.require('treesaver.capabilities');
goog.require('treesaver.debug');
goog.require('treesaver.dimensions');
goog.require('treesaver.dom');
goog.require('treesaver.ui.Scrollable');



goog.require('treesaver.events');
goog.require('treesaver.ui.Article');
goog.require('treesaver.ui.Document');
goog.scope(function() {
  var debug = treesaver.debug,
      dimensions = treesaver.dimensions,
      dom = treesaver.dom,
      events = treesaver.events,
      Article = treesaver.ui.Article;;

  /**
   * LightBox
   *
   * @param {!Element} node HTML node.
   * @constructor
   */
  treesaver.ui.LightBox = function(node) {
    var containerNode = dom.querySelectorAll('.container', node)[0];

    // DEBUG-only validation
    if (goog.DEBUG) {
      if (!containerNode) {
        debug.error('No container within lightbox!');
      }
    }

    // TODO: Only store mutable capabilities
    this.requirements = dom.hasAttr(node, 'data-requires') ?
      node.getAttribute('data-requires').split(' ') : null;

    this.html = node.parentNode.innerHTML;

    this.size = new dimensions.Metrics(node);

    // Clean up metrics object
    delete this.size.w;
    delete this.size.h;
  };


    treesaver.ui.LightBox.watchedEvents = [
        Article.events.PAGINATIONPROGRESS,
        Article.events.PAGINATIONPRELOADING  ,
        //treesaver.ui.StateManager.events.ORIENTATIONCHANGED,
        "treesaver.orientationchanged",   //TODO: Reference treesaver.ui.StateManger.events
        'mousewheel',
        'DOMMouseScroll'
    ];



});

goog.scope(function() {
  var LightBox = treesaver.ui.LightBox,
      capabilities = treesaver.capabilities,
      debug = treesaver.debug,
      dimensions = treesaver.dimensions,
      dom = treesaver.dom,
      events = treesaver.events,
      Article = treesaver.ui.Article,
      Document = treesaver.ui.Document,
      Scrollable = treesaver.ui.Scrollable;







        /**
   * List of required capabilities for this LightBox
   *
   * @type {?Array.<string>}
   */
  LightBox.prototype.requirements;

  /**
   * @type {string}
   */
  LightBox.prototype.html;

  /**
   * The measurements of the chrome
   * @type {!treesaver.dimensions.Metrics}
   */
  LightBox.prototype.size;

  /**
   * @type {boolean}
   */
  LightBox.prototype.active;

  /**
   * @type {?Element}
   */
  LightBox.prototype.node;

  /**
   * @type {?Element}
   */
  LightBox.prototype.container;



    LightBox.prototype.handleEvent = function(e) {
        if (e.type === "treesaver.orientationchanged") {
            // We have new pages to display
            // TODO
            // Fire event
            //events.fireEvent(document, ArticleManager.events.PAGESCHANGED);

            this.layoutLightbox(this.container);

            return;
        }
    }

  /**
   * @return {!Element} The activated node.
   */
  LightBox.prototype.activate = function() {
    if (!this.active) {
      this.active = true;

      this.node = dom.createElementFromHTML(this.html);
      this.container = dom.querySelectorAll('.container', this.node)[0];



        LightBox.watchedEvents.forEach(function(evt) {
            var that = this;
            events.addListener(document, evt, function(event) {
                that.handleEvent(event);
            }
          );
        },this);


       // if (capabilities.SUPPORTS_ORIENTATION && !treesaver.inContainedMode) {
       //     events.addListener(window, 'orientationchange',LightBox.handleEvent);
       // }



    }

    return /** @type {!Element} */ (this.node);
  };



   LightBox.prototype.layoutLightbox=function(container) {
       var screenW = dimensions.getOffsetWidth(container.offsetParent),
           screenH = dimensions.getOffsetHeight(container.offsetParent),
           orientation =   window['orientation'],
           contentW, contentH, windowW,windowH,metrics,tmp_w;


       metrics = new dimensions.Metrics(container);
       contentW = metrics.w;
       contentH = metrics.h;
       windowW =  window.screen.width;
       windowH =  window.screen.height;


       if (capabilities.SUPPORTS_ORIENTATION && !treesaver.inContainedMode) {
           if (orientation % 180) {
               // Rotated (landscape)
               // StateManager.state_.viewport.setAttribute('content',
               //    'width=device-height, height=device-width');
               tmp_w = contentW;
               contentW=contentH;
               contentH=tmp_w;

               tmp_w = screenW;
               screenW = screenH;
               screenH = tmp_w;

               windowW =  window.screen.height;
               windowH =  window.screen.width;


               tmp_w = metrics.bpWidth;

               metrics.bpWidth = metrics.bpHeight;
               metrics.bpHeight = tmp_w;

           } else {
               // Normal
               //  StateManager.state_.viewport.setAttribute('content',
               //      'width=device-width, height=device-height');
           }
       }
       dimensions.setCssPx(container.parentElement,"width",windowW)    ;
       dimensions.setCssPx(container.parentElement,"height",windowH)    ;
       // Center the container on the screen (use offsetWidth to include border/padding)
       dimensions.setCssPx(container, 'left', (screenW - contentW - metrics.bpWidth) / 2);
       dimensions.setCssPx(container, 'top', (screenH - contentH - metrics.bpHeight) / 2);



   };


  /**
   * Deactivate the lightbox
   */
  LightBox.prototype.deactivate = function() {
    if (!this.active) {
      return;
    }

    this.active = false;
      LightBox.watchedEvents.forEach(function(evt) {
          events.removeListener(document, evt, LightBox.handleEvent);
      });
     // if (capabilities.SUPPORTS_ORIENTATION && !treesaver.inContainedMode) {
     ///     events.removeListener(window, 'orientationchange', LightBox.handleEvent);
     // }
    // Make sure to drop references
    this.node = null;
  };

  /**
   * The maximum available space within the lightbox right now
   *
   * @return {!treesaver.dimensions.Size}
   */
  LightBox.prototype.getMaxSize = function() {
    if (goog.DEBUG) {
      if (!this.node || !this.container) {
        debug.error('No active container for lightbox');
      }
    }

    // Compiler cast
    this.container = /** @type {!Element} */ (this.container);

    // TODO: Query only needed properties
    var metrics = new dimensions.Metrics(this.container);

    return {
      w: metrics.w,
      h: metrics.h
    };
  };


  /**
   * @param {!treesaver.layout.Figure} figure
   */
  LightBox.prototype.showFigure = function(figure) {
    var containerSize = this.getMaxSize(),
        largest = figure.getLargestSize(containerSize, true),
        screenW = dimensions.getOffsetWidth(this.container.offsetParent),
        screenH = dimensions.getOffsetHeight(this.container.offsetParent),
        scrollNode,
        contentW, contentH, metrics;

    // TODO: Provide name for sizing via CSS?

    // Closure compiler cast
    this.container = /** @type {!Element} */ (this.container);

    if (this.active && largest) {
      largest.figureSize.applySize(this.container, largest.name);
      this.container.style.bottom = 'auto';
      this.container.style.right = 'auto';

      // What's the size of the content?
      // TODO: Refactor to query only needed properties
      metrics = new dimensions.Metrics(this.container);
      contentW = metrics.w;
      contentH = metrics.h;

      // Clamp in case of scrolling
      if (figure.scrollable) {
        contentW = Math.min(containerSize.w, contentW);
        contentH = Math.min(containerSize.h, contentH);
        dimensions.setCssPx(this.container, 'width', contentW);
        dimensions.setCssPx(this.container, 'height', contentH);
        dom.addClass(this.container, 'scroll');
        Scrollable.initDom(this.container);
      }

        this.layoutLightbox(this.container);

      // Center the container on the screen (use offsetWidth to include border/padding)
      //dimensions.setCssPx(this.container, 'left', (screenW - contentW - metrics.bpWidth) / 2);
      //dimensions.setCssPx(this.container, 'top', (screenH - contentH - metrics.bpHeight) / 2);
      return true;
    }
    else {
      return false;
    }
  };

  /**
   * @param {treesaver.dimensions.Size} availSize
   * @return {boolean} True if fits.
   */
  LightBox.prototype.fits = function(availSize) {
    return dimensions.inSizeRange(this.size, availSize);
  };

  /**
   * @return {boolean} True if the LightBox meets current browser capabilities.
   */
  LightBox.prototype.meetsRequirements = function() {
    if (!this.requirements) {
      return true;
    }

    return capabilities.check(this.requirements, true);
  };

  /**
   * Find the first lightbox that meets the current requirements
   *
   * @param {Array.<treesaver.ui.LightBox>} lightboxes
   * @param {treesaver.dimensions.Size} availSize
   * @return {?treesaver.ui.LightBox} A suitable LightBox, if one was found.
   */
  LightBox.select = function(lightboxes, availSize) {
    // Cycle through lightboxes
    var i, len, current, lightbox = null;

    for (i = 0, len = lightboxes.length; i < len; i += 1) {
      current = lightboxes[i];
      if (current.meetsRequirements() && current.fits(availSize)) {
        lightbox = current;
        break;
      }
    }

    if (!lightbox) {
      debug.error('No LightBox Fits!');
    }

    return lightbox;
  };
});
