(function($){
  $.widget("ui.apex_super_lov", {
     options: {
        enterable: null,
        returnColNum: null,
        displayColNum: null,
        hiddenCols: null,
        searchableCols: null,
        mapFromCols: null,
        mapToItems: null,
        maxRowsPerPage: null,
        dialogTitle: null,
        useClearProtection: null,
        noDataFoundMsg: null,
        loadingImageSrc: null,
        ajaxIdentifier: null,
        reportHeaders: null,
        effectsSpeed: null,
        dependingOnSelector: null,
        pageItemsToSubmit: null,
        debug: $('#pdebug').length !== 0 //true boolean for ===
     },
     _createPrivateStorage: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Create Private Storage (' + $(uiw.element).attr('id') + ')');
        }
        
        uiw._values = {
           apexItemId: '',
           controlsId: '',
           deleteIconTimeout: '',
           searchString: '',
           pagination: '',
           fetchLovInProcess: false,
           fetchLovMode: '', //ENTERABLE or DIALOG
           active: false,
           ajaxReturn: '',
           curPage: '',
           moreRows: false,
           wrapperHeight: 0,
           dialogHeight: 0,
           dialogWidth: 0,
           dialogTop: 0,
           dialogLeft: 0,
           percentRegExp: /^-?[0-9]+\.?[0-9]*%$/,
           pixelRegExp: /^-?[0-9]+\.?[0-9]*px$/i,
           hiddenCols: (uiw.options.hiddenCols) ? uiw.options.hiddenCols.split(',') : [],
           searchableCols: (uiw.options.searchableCols) ? uiw.options.searchableCols.split(',') : [],
           mapFromCols: (uiw.options.mapFromCols) ? uiw.options.mapFromCols.split(',') : [],
           mapToItems: (uiw.options.mapToItems) ? uiw.options.mapToItems.split(',') : [],
           bodyKeyMode: 'SEARCH', //SEARCH or ROWSELECT
           disabled: false,
           focusOnClose: 'BUTTON', //BUTTON or INPUT,
           ENTERABLE_RESTRICTED: 'ENTERABLE_RESTRICTED',
           ENTERABLE_UNRESTRICTED: 'ENTERABLE_UNRESTRICTED',
           lastDisplayValue: '',
           changePropagationAllowed: false
        };
        
        if (uiw.options.debug){
           apex.debug('...Private Values');
           
           for (name in uiw._values) {
              apex.debug('......' + name + ': "' + uiw._values[name] + '"');
           }
        }
        
        uiw._elements = {
           $itemHolder: {},
           $window: {},
           $hiddenInput: {},
           $displayInput: {},
           $label: {},
           $fieldset: {},
           $clearButton: {},
           $openButton: {},
           $outerDialog: {},
           $dialog: {},
           $buttonContainer: {},
           $searchContainer: {},
           $paginationContainer: {},
           $columnSelect: {},
           $filter: {},
           $goButton: {},
           $prevButton: {},
           $paginationDisplay: {},
           $nextButton: {},
           $wrapper: {},
           $table: {},
           $nodata: {},
           $moreRows: {},
           $selectedRow: {},
           $actionlessFocus: {}
        };
        
        if (uiw.options.debug){
           apex.debug('...Cashed Elements');
           
           for (name in uiw._elements) {
              apex.debug('......' + name + ': "' + uiw._elements[name] + '"');
           }
        }
     },
     _create: function() {
        var uiw = this;
        var preLoadImg;
        var backColor;
        var backImage;
        var backRepeat;
        var backAttachment;
        var backPosition;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Initialize (' + $(uiw.element).attr('id') + ')');
           apex.debug('...Options');
           
           for (name in uiw.options) {
              apex.debug('......' + name + ': "' + uiw.options[name] + '"');
           }
        }
  
        uiw._createPrivateStorage();
        uiw._values.apexItemId = $(uiw.element).attr('id');
        uiw._values.controlsId = uiw._values.apexItemId + '_fieldset';
        uiw._initBaseElements();
        uiw._values.lastDisplayValue = uiw._elements.$displayInput.val();
/*  
        backColor = uiw._elements.$displayInput.css('background-color');
        backImage = uiw._elements.$displayInput.css('background-image');
        backRepeat = uiw._elements.$displayInput.css('background-repeat');
        backAttachment = uiw._elements.$displayInput.css('background-attachment');
        backPosition = uiw._elements.$displayInput.css('background-position');
  
        uiw._elements.$fieldset.css({
           'background-color':backColor,
           'background-image':backImage,
           'background-repeat':backRepeat,
           'background-attachment':backAttachment,
           'background-position':backPosition
        });
*/        
        uiw._elements.$openButton
            .off('click').on('click', {uiw: uiw}, uiw._handleOpenClick)
            .button({
              text: false,
              label: "Open Dialog",
              icons: {
                 primary: "ui-icon-circle-triangle-n"
              }
           });
  // ApEx 5 Adjustment : remove following line
  //         .css('height', uiw._elements.$displayInput.outerHeight(true)
  
  
        uiw._elements.$clearButton
           .button({
              text: false,
              label: "Clear Contents",
              icons: {
                 primary: "ui-icon-circle-close"
              }
           })
  // ApEx 5 Adjustment : remove following line
  //         .css('height', uiw._elements.$displayInput.outerHeight(true))
           .bind('click', {uiw: uiw}, uiw._handleClearClick)
           .parent().buttonset();
           
        uiw._elements.$clearButton
           .removeClass('ui-corner-left');
        
        uiw._elements.$displayInput.bind('apexrefresh', function() {
           uiw._refresh();
        });
        
        if (uiw.options.enterable === uiw._values.ENTERABLE_RESTRICTED
          || uiw.options.enterable === uiw._values.ENTERABLE_UNRESTRICTED
        ) {
           uiw._elements.$displayInput
              .bind('keypress', {uiw: uiw}, uiw._handleEnterableKeypress)
              .bind('blur', {uiw: uiw}, uiw._handleEnterableBlur);
        }
        
        if (uiw.options.dependingOnSelector) {
           $(uiw.options.dependingOnSelector).bind('change', function() {
              uiw._elements.$displayInput.trigger('apexrefresh');
           });
        }
        
        apex.widget.initPageItem(uiw._elements.$displayInput.attr('id'), {
           setValue: function(value, displayValue) {
              uiw._elements.$hiddenInput.val(value);
              uiw._elements.$displayInput.val(displayValue);
              uiw._values.lastDisplayValue = displayValue;
           },
           getValue: function() {
              return uiw._elements.$hiddenInput.val();
           },
           show: function() {
              uiw.show()
           },
           hide: function() {
              uiw.hide()
           },
           enable: function() {
              uiw.enable()
           },
           disable: function() {
              uiw.disable()
           }
        });
     },
     _initBaseElements: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Initialize Base Elements (' + uiw._values.apexItemId + ')');
        }
        
        uiw._elements.$itemHolder = $('table#' + uiw._values.apexItemId + '_holder');
        uiw._elements.$hiddenInput = $('#' + uiw._values.apexItemId + '_HIDDENVALUE');
        uiw._elements.$displayInput = uiw.element;
        uiw._elements.$label = $('label[for="' + uiw._values.apexItemId + '"]');
        uiw._elements.$fieldset = $('#' + uiw._values.controlsId);
        uiw._elements.$clearButton =
           $('#' + uiw._values.controlsId + ' button.superlov-modal-delete');
        uiw._elements.$openButton =
           $('#' + uiw._values.controlsId + ' button.superlov-modal-open');
     },
     _initElements: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Initialize Elements (' + uiw._values.apexItemId + ')');
        }
  
        uiw._elements.$window = $(window);
        uiw._elements.$outerDialog = $('div.superlov-dialog');
        uiw._elements.$dialog = $('div.superlov-container');
        //uiw._elements.$dialog = $('#' + uiw._values.apexItemId + '_superlov');
        uiw._elements.$buttonContainer = $('div.superlov-button-container');
        uiw._elements.$searchContainer = $('div.superlov-search-container');
        uiw._elements.$paginationContainer = $('div.superlov-pagination-container');
        uiw._elements.$columnSelect = $('select#superlov-column-select');
        uiw._elements.$filter = $('input#superlov-filter');
        uiw._elements.$searchButton = $('div.superlov-search-icon');
        uiw._elements.$prevButton = $('button#superlov-prev-page');
        uiw._elements.$paginationDisplay = $('span#superlov-pagination-display');
        uiw._elements.$nextButton = $('button#superlov-next-page');
        uiw._elements.$wrapper = $('div.superlov-table-wrapper');
        uiw._elements.$actionlessFocus = $('#superlov-focusable');
     },
     _initTransientElements: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Initialize Transient Elements (' + uiw._values.apexItemId + ')');
        }
  
        uiw._elements.$table = $('table.superlov-table');
        uiw._elements.$nodata = $('div.superlov-nodata');
        uiw._elements.$moreRows = $('input#asl-super-lov-more-rows');
     },
     _initButtons: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Initialize Buttons (' + uiw._values.apexItemId + ')');
        }
  
        uiw._elements.$searchButton
           .bind('click', {uiw: uiw}, uiw._handleSearchButtonClick);
  
        uiw._elements.$prevButton
           .button({
              text: false,
              icons: {
                 primary: "ui-icon-arrowthick-1-w"
              }
           })
           .bind('click', {uiw: uiw}, uiw._handlePrevButtonClick);
  
        uiw._elements.$nextButton
           .button({
              text: false,
              icons: {
                 primary: "ui-icon-arrowthick-1-e"
              }
           })
           .bind('click', {uiw: uiw}, uiw._handleNextButtonClick);
     },
     _initColumnSelect: function() {
        var uiw = this;
        var columnSelect = uiw._elements.$columnSelect.get(0);
        var count = 1;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Initialize Column Select (' + uiw._values.apexItemId + ')');
        }
        
        for (x=0; x<uiw.options.reportHeaders.length; x++) {
           if (!uiw._isHiddenCol(x+1) && uiw._isSearchableCol(x+1)) {
              columnSelect.options[count] = new Option(uiw.options.reportHeaders[x], x+1);
              count += 1;
           }
        }
        
        $('select#superlov-column-select option[value="' + uiw.options.displayColNum  + '"]')
           .attr('selected','selected');
     },
     _handleColumnChange: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Handle Column Change (' + uiw._values.apexItemId + ')');
        }
  
        if (uiw._elements.$columnSelect.val()) {
           uiw._elements.$filter.removeAttr('disabled');
        } else {
           uiw._elements.$filter
              .val('')
              .attr('disabled','disabled');
        }
        uiw._updateStyledFilter();
     },
     _ieNoSelectText: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - IE No Select Text (' + uiw._values.apexItemId + ')');
        }
        
        if(document.attachEvent) {
           $('div.superlov-table-wrapper *').each(function() {
              $(this)[0].attachEvent('onselectstart', function() {return false;});
           });
        }
     },
     _isHiddenCol: function(colNum) {
        var uiw = this;
        var retval = false;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Is Hidden Column (' + uiw._values.apexItemId + ')');
        }
        
        for (i = 0; i < uiw._values.hiddenCols.length; i++) {
           if (parseInt(colNum, 10) === parseInt(uiw._values.hiddenCols[i], 10)) {
              retval = true;
              break;
           }
        }
        
        return retval;
     },
     _isSearchableCol: function(colNum) {
        var uiw = this;
        var retval = false;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Is Searchable Column (' + uiw._values.apexItemId + ')');
        }
        
        if (uiw._values.searchableCols.length) {         
           for (i = 0; i < uiw._values.searchableCols.length; i++) {
              if (parseInt(colNum, 10) === parseInt(uiw._values.searchableCols[i], 10)) {
                 retval = true;
                 break;
              }
           }
        } else {
           retval = true;
        }
        
        return retval;
     },
     _showDialog: function() {
        var uiw = this;
        var buttonContainerWidth;
        var buttonContainerHeight;
        var dialogHtml;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Show Dialog (' + uiw._values.apexItemId + ')');
        }
        //greg j 2015-06-07 added a unique id so we can have multiples on page
        dialogHtml =
              '<div id="' + uiw._values.apexItemId + '_superlov" class="superlov-container ui-widget utr-container">\n'
           +  '   <div class="superlov-button-container ui-widget-header ui-corner-all ui-helper-clearfix">\n'
           +  '      <div class="superlov-search-container">\n'
           +  '         <table>\n'
           +  '            <tr>\n'
           +  '               <td valign="middle">\n'
           +  '                  Search<a id="superlov-focusable" href="#" style="text-decoration: none;">&nbsp;</a>\n'
           +  '               </td>\n'
           +  '               <td valign="middle">\n'
           +  '                  <select id="superlov-column-select" size="1">\n'
           +  '                     <option value="">- Select Column -</option>\n'
           +  '                  </select>\n'
           +  '               </td>\n'
           +  '               <td>\n'
           +  '                  <div id="superlov_styled_filter" class="ui-corner-all">\n'
           +  '                     <table>\n'
           +  '                        <tbody>\n'
           +  '                           <tr>\n'
           +  '                              <td>\n'
           +  '                                 <input type="text" id="superlov-filter" class="ui-corner-all"/>\n'
           +  '                              </td>\n'
           +  '                              <td>\n'
           +  '                                 <div class="ui-state-highlight superlov-search-icon"><span class="ui-icon ui-icon-circle-zoomin"></span></div>\n'
           +  '                              </td>\n'
           +  '                           </tr>\n'
           +  '                        </tbody>\n'
           +  '                     </table>\n'
           +  '                  </div>\n'
           +  '               </td>\n'
           +  '            </tr>\n'
           +  '         </table>\n'
           +  '      </div>\n'
           +  '      <div class="superlov-pagination-container">\n'
           +  '         <table>\n'
           +  '            <tr>\n'
           +  '               <td valign="middle">\n'
           +  '                  <button id="superlov-prev-page">Previous Page</button>\n'
           +  '               </td>\n'
           +  '               <td valign="middle">\n'
           +  '                  <span id="superlov-pagination-display">Page 1</span>\n'
           +  '               </td>\n'
           +  '               <td valign="middle">\n'
           +  '                  <button id="superlov-next-page">Next Page</button>\n'
           +  '               </td>\n'
           +  '            </tr>\n'
           +  '         </table>\n'
           +  '      </div>\n'
           +  '   </div>\n'
           +  '      <div class="superlov-table-wrapper">\n'
           +  '         <img id="superlov-loading-image" src="' + uiw.options.loadingImageSrc + '">\n'
           +  '   </div>\n'
           +  '</div>\n'
        ;
  
        $('body').append(
           dialogHtml
        );
  
        uiw._initElements();
  
        uiw._values.pagination = '1:' + uiw.options.maxRowsPerPage;
        uiw._values.curPage = 1;
  
        uiw._initButtons();
  
        //greg j 2015-06-08 values in options are getting replaced on open uiw._initColumnSelect();
  
        uiw._elements.$filter
           .bind('focus', {uiw: uiw}, uiw._handleFilterFocus);
           
        var bColor = uiw._elements.$filter.css('border-top-color');
         var bWidth = uiw._elements.$filter.css('border-top-width');
        var bStyle = uiw._elements.$filter.css('border-top-style');
        var backColor = uiw._elements.$filter.css('background-color');
      var backImage = uiw._elements.$filter.css('background-image');
      var backRepeat = uiw._elements.$filter.css('background-repeat');
      var backAttachment = uiw._elements.$filter.css('background-attachment');
      var backPosition = uiw._elements.$filter.css('background-position');
  
        uiw._elements.$filter.css('border', 'none');
        $('#superlov_styled_filter').css({
           'border-color':bColor,
           'border-width':bWidth,
           'border-style':bStyle,
           'background-color':backColor,
           'background-image':backImage,
           'background-repeat':backRepeat,
           'background-attachment':backAttachment,
           'background-position':backPosition
        });
  
        uiw._disableSearchButton();
        uiw._disablePrevButton();
        uiw._disableNextButton();
  
        // buttonContainerWidth = uiw._elements.$searchContainer.width()
        //    + uiw._elements.$paginationContainer.width();
  
        // uiw._elements.$buttonContainer
        //    .css('width', buttonContainerWidth + 10 + 'px');
           
        buttonContainerHeight = uiw._elements.$buttonContainer.height();
        // uiw._elements.$paginationContainer
        //    .css('height', buttonContainerHeight + 'px');
        // uiw._elements.$searchContainer
        //    .css('height', buttonContainerHeight + 'px');
  
  
        uiw._elements.$dialog.dialog({
           disabled: false,
           autoOpen: false,
           closeOnEscape: true,
           closeText: "Close",
           dialogClass: "superlov-dialog",
           draggable: true,
           height: "auto",
           hide: null,
           maxHeight: false,
           maxWidth: false,
           minHeight: 150,
           minWidth: false,
           modal: true,
           resizable: false,
           show: null,
           stack: true,
           title: uiw.options.dialogTitle,
           open: function() {            
              uiw._elements.$filter.trigger('focus');
              
              if (uiw._values.fetchLovMode === 'DIALOG') {
                 uiw._fetchLov();
              } else if (uiw._values.fetchLovMode === 'ENTERABLE') {
                 uiw._elements.$filter.val(uiw._values.searchString);
              }
              
              uiw._values.fetchLovMode = 'DIALOG';
  
           },
           close: function() {
              $('body').unbind('keydown', uiw._handleBodyKeydown);
              $(document).unbind('keydown', uiw._disableArrowKeyScrolling);
  
              $(document)
                  .off('mouseenter', 'table.superlov-table tbody tr')
                  .off('mouseleave', 'table.superlov-table tbody tr')
                  .off('click', 'table.superlov-table tbody tr');
  
              uiw._values.active = false;
              uiw._values.fetchLovInProcess = false;
              $(this).dialog('destroy').remove();
              uiw._elements.$dialog.remove();
              
              if (uiw._values.focusOnClose === 'BUTTON') {
                 uiw._elements.$openButton.focus();
              } else if (uiw._values.focusOnClose === 'INPUT') {
                 uiw._elements.$displayInput.focus();
              }
              
              if (uiw._elements.$displayInput.val() === '') {
                 uiw.allowChangePropagation();
                 uiw._elements.$hiddenInput.trigger('change');
                 uiw._elements.$displayInput.trigger('change');
                 uiw.preventChangePropagation();
              }
              
              uiw._values.focusOnClose = 'BUTTON';
           }
        });
  
        uiw._initElements();
        uiw._elements.$dialog.css('overflow', 'hidden');
        // uiw._elements.$outerDialog
        //    .css('min-width', buttonContainerWidth + 42 + 'px');
        
        //Set the position of the element.  Must do this after the initialization
        //of the dialog so that the calculation of leftPos can be done using the
        //superlov-dialog element.
        uiw._values.dialogTop = uiw._elements.$window.height()*.05;
  
        uiw._values.dialogLeft =
           (uiw._elements.$window.width()/2)
           - (uiw._elements.$outerDialog.outerWidth(true)/2);
        if (uiw._values.dialogLeft < 0) {
           uiw._values.dialogLeft = 0;
        }
  
        uiw._elements.$dialog.dialog().dialog('option', 'position', [uiw._values.dialogLeft, uiw._values.dialogTop]);
        //uiw._elements.$dialog.dialog('option', 'position', [uiw._values.dialogLeft, uiw._values.dialogTop]);
  
        uiw._ieNoSelectText();
  
        $('body').bind('keydown', {uiw: uiw}, uiw._handleBodyKeydown);
        $(document).bind('keydown', {uiw: uiw}, uiw._disableArrowKeyScrolling);
  
        $(document)
           .on('mouseenter', 'table.superlov-table tbody tr', {uiw: uiw}, uiw._handleMainTrMouseenter)
           .on('mouseleave', 'table.superlov-table tbody tr', {uiw: uiw}, uiw._handleMainTrMouseleave)
           .on('click', 'table.superlov-table tbody tr', {uiw: uiw}, uiw._handleMainTrClick);
  
        uiw._elements.$window.bind('resize', {uiw: uiw}, uiw._handleWindowResize);
  
        //greg j 2015-06-07 the dialog creates a new element so the options are not stored on $dialog
        //uiw._elements.$dialog.dialog().dialog('open');
        uiw._elements.$dialog.dialog('open');
  
        uiw._initColumnSelect();
        uiw._elements.$columnSelect.bind('change', function() {
           uiw._handleColumnChange();
        });
     },
     _handleWindowResize: function(e) {
        var uiw = e.data.uiw;
        var leftPos;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Handle Window Resize (' + uiw._values.apexItemId + ')');
        }
  
        if (!uiw._elements.$table.length && !uiw._elements.$nodata.length) {
           uiw._initTransientElements();
        }
  
        uiw._updateLovMeasurements();
  
        uiw._elements.$outerDialog.css({
           'height':uiw._values.dialogHeight,
           'width':uiw._values.dialogWidth
        });
  
        uiw._elements.$wrapper.css({
           'height':uiw._values.wrapperHeight,
           'width':uiw._values.wrapperWidth,
           'overflow':'hidden'
        });
  
        leftPos = (uiw._elements.$window.width()/2)
        - (uiw._elements.$outerDialog.outerWidth(true)/2);
  
        if (leftPos < 0) {
           leftPos = 0;
        }
  
        uiw._elements.$outerDialog.css({
           'top':uiw._values.dialogTop,
           'left':leftPos
        });
  
        uiw._elements.$wrapper.css('overflow', 'auto');
     },
     _handleBodyKeydown: function(eventObj) {
        var uiw = eventObj.data.uiw;
        var $current;
        var $select;
        var rowPos;
        var viewport;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Handle Body Keydown (' + uiw._values.apexItemId + ')');
        }
        
        if (eventObj.which === 37 && !uiw._elements.$prevButton.attr('disabled')) {//left
           if (uiw._values.bodyKeyMode === 'ROWSELECT') {
              uiw._handlePrevButtonClick(eventObj);
           }
        }
        else if (eventObj.which === 39 && !uiw._elements.$nextButton.attr('disabled')) {//right
           if (uiw._values.bodyKeyMode === 'ROWSELECT') {
              uiw._handleNextButtonClick(eventObj);
           }
        }
        else if (eventObj.which === 38 && eventObj.target != uiw._elements.$columnSelect[0]) {//up
           uiw._values.bodyKeyMode = 'ROWSELECT';
           uiw._elements.$actionlessFocus.trigger('focus');
           
           $current = uiw._elements.$table.find('tbody>tr').has('td.ui-state-hover');
           
           if ($current.length === 0) {
              $select = uiw._elements.$table.find('tbody>tr:last');
           }
           else if ($current.get(0) === uiw._elements.$table.find('tbody>tr:first').get(0)) {
              $select = uiw._elements.$table.find('tbody>tr:last');
           }
           else {
              $select = $current.prev();
           }
           
           $current.trigger('mouseout');
           $select
              .trigger('mouseover')
              .focus();
           
           rowPos = $select.position().top - uiw._elements.$wrapper.position().top;
           viewport = {
              "top": 0
              , "bottom": uiw._elements.$wrapper.outerHeight(true)
           };
           
           if ($select[0] === uiw._elements.$table.find('tbody>tr:first')[0]) {
              uiw._elements.$wrapper.scrollTop(0);
           }
           else {
              if (rowPos < viewport.top) {
                 uiw._elements.$wrapper.scrollTop(uiw._elements.$wrapper.scrollTop() + rowPos - 5);
              }
              else if (rowPos + $select.height() > viewport.bottom) {
                 uiw._elements.$wrapper.scrollTop(uiw._elements.$wrapper.scrollTop() + rowPos + $select.height() - viewport.bottom + 5);
              }
           }
        }
        else if (eventObj.which === 40 && eventObj.target != uiw._elements.$columnSelect[0]) {//down
           uiw._values.bodyKeyMode = 'ROWSELECT';
           uiw._elements.$actionlessFocus.trigger('focus');
           
           $current = uiw._elements.$table.find('tbody>tr').has('td.ui-state-hover');
  
           if ($current.length === 0) {
              $select = uiw._elements.$table.find('tbody>tr:first');
           }
           else if ($current.get(0) === uiw._elements.$table.find('tbody>tr:last').get(0)) {
              $select = uiw._elements.$table.find('tbody>tr:first');
           }
           else {
              $select = $current.next();
           }
           
           $current.trigger('mouseout');
           $select
              .trigger('mouseover')
              .focus();
              
           rowPos = $select.position().top - uiw._elements.$wrapper.position().top;
           viewport = {
              "top": 0
              , "bottom": uiw._elements.$wrapper.outerHeight(true)
           };
           
           if ($select[0] === uiw._elements.$table.find('tbody>tr:first')[0]) {
              uiw._elements.$wrapper.scrollTop(0);
           }
           else {
              if (rowPos < viewport.top) {
                 uiw._elements.$wrapper.scrollTop(uiw._elements.$wrapper.scrollTop() + rowPos - 5);
              }
              else if (rowPos + $select.height() > viewport.bottom) {
                 uiw._elements.$wrapper.scrollTop(uiw._elements.$wrapper.scrollTop() + rowPos + $select.height() - viewport.bottom + 5);
              }
           }
        }
        else if (eventObj.which === 13) {//enter
           if (
              uiw._values.bodyKeyMode === 'ROWSELECT'
              && eventObj.target != uiw._elements.$columnSelect[0]
              && eventObj.target != uiw._elements.$prevButton[0]
              && eventObj.target != uiw._elements.$nextButton[0]
              && eventObj.target != uiw._elements.$searchButton[0]
           ) {
              $('#superlov-fetch-results>tbody>tr')
                 .has('td.ui-state-hover').trigger('click');
                
              //Stop bubbling otherwise dialog will re-open
              eventObj.preventDefault();
              return false;
           }
           else if (
              uiw._values.bodyKeyMode === 'SEARCH'
              && eventObj.target != uiw._elements.$displayInput[0]
              && eventObj.target != uiw._elements.$columnSelect[0]
              && eventObj.target != uiw._elements.$prevButton[0]
              && eventObj.target != uiw._elements.$nextButton[0]
              && eventObj.target != uiw._elements.$searchButton[0]
           ) {
              uiw._search();
           }
        }
     },
     _handleOpenClick: function(eventObj) {
        var uiw = eventObj.data.uiw;
        // greg j 2015-06-8 prevent double clicks..particularly due to hammer.js
        if (!uiw._values.active) {
           uiw._values.active = true;
           if (uiw.options.debug){
            apex.debug('Super LOV - Handle Open Click');
           }
        
           uiw._values.fetchLovMode = 'DIALOG';
           uiw._values.searchString = '';
           uiw._showDialog();
        }
        return false;
     },
     _handleEnterableKeypress: function(eventObj) {
        var uiw = eventObj.data.uiw;
        
        if (eventObj.which === 13
           && uiw._elements.$displayInput.val() !== uiw._values.lastDisplayValue
        ) {
           uiw._values.focusOnClose = 'INPUT';
           uiw._elements.$displayInput.trigger('blur');  
        }
     },
     _handleEnterableBlur: function(eventObj) {
        var uiw = eventObj.data.uiw;
        
        if (uiw._elements.$displayInput.val() !== uiw._values.lastDisplayValue) {
           uiw._values.lastDisplayValue = uiw._elements.$displayInput.val();
           uiw._handleEnterableChange();
        }
     },
     _handleEnterableChange: function() {
        var uiw = this;
        
        for (x = 0; x < uiw._values.mapToItems.length; x++) {
           $s(uiw._values.mapToItems[x], '');
        }
        
        if (uiw.options.enterable === uiw._values.ENTERABLE_RESTRICTED) {   
           if (uiw._elements.$displayInput.val()) {
              uiw._values.fetchLovMode = 'ENTERABLE';
              uiw._fetchLov();
           } else {
              uiw._elements.$hiddenInput.val('');
           }
        } else if (uiw.options.enterable === uiw._values.ENTERABLE_UNRESTRICTED) {   
           uiw._elements.$hiddenInput.val(uiw._elements.$displayInput.val());
        }
     },
     _fetchLov: function() {
        var uiw = this;
        var searchColumnNo;
        var queryString;
        var fetchLovId = 0;
        var asyncAjax;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Fetch LOV (' + uiw._values.apexItemId + ')');
        }
        
        if (uiw._values.fetchLovInProcess) {
           return;
        } else {
           uiw._values.fetchLovInProcess = true;
        }
        
        if (uiw._values.fetchLovMode === 'DIALOG') {
           asyncAjax = true;
           fetchLovId = Math.floor(Math.random()*10000000001); //Used with async to make sure the Ajax return maps to correct dialog
           uiw._elements.$wrapper.data('fetchLovId', fetchLovId);
  
           uiw._disableSearchButton();
           uiw._disablePrevButton();
           uiw._disableNextButton();
           uiw._elements.$window.unbind('resize', uiw._handleWindowResize);
  
           if (uiw._elements.$columnSelect.val() && uiw._elements.$filter.val()) {
              searchColumnNo = uiw._elements.$columnSelect.val();
              uiw._values.searchString = uiw._elements.$filter.val();
           } else {
              uiw._values.searchString = '';
           }
        } else if (uiw._values.fetchLovMode === 'ENTERABLE') {
           asyncAjax = false;
           
           uiw._elements.$fieldset.after('<span class="loading-indicator superlov-loading"></span>');
           uiw._values.pagination = '1:' + uiw.options.maxRowsPerPage;
     
           searchColumnNo = uiw.options.displayColNum;
           uiw._values.searchString = uiw._elements.$displayInput.val();
        }
        //Breaking out the query string so that the arg_names and arg_values
        //can be added as arrays after
        queryString = {
           p_flow_id: $('#pFlowId').val(),
           p_flow_step_id: $('#pFlowStepId').val(),
           p_instance: $('#pInstance').val(),
           p_request: 'PLUGIN=' + uiw.options.ajaxIdentifier,
           x01: 'FETCH_LOV',
           x02: uiw._values.pagination,
           x03: searchColumnNo,
           x04: uiw._values.searchString,
           x05: fetchLovId,
           p_arg_names: [],
           p_arg_values: []
        }
        
        //Building up the arg_names and arg_values as arrays
        //jQuery's ajax will break them back up automatically
        $(uiw.options.dependingOnSelector).add(uiw.options.pageItemsToSubmit).each(function(i){
           queryString.p_arg_names[i] = this.id;
           queryString.p_arg_values[i] = $v(this);
        });
  
        $.ajax({
           type: 'POST',
           url: 'wwv_flow.show',
           data: queryString,
           dataType: 'text',
           async: asyncAjax,
           success: function(data) {
              uiw._values.ajaxReturn = data;
              uiw._handleFetchLovReturn();
           }
        });
     },
     _handleFetchLovReturn: function() {
        var uiw = this;
        var noDataFoundMsg;
        var resultsReturned;
        var $ajaxReturn = $(uiw._values.ajaxReturn);
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Handle Fetch LOV Return (' + uiw._values.apexItemId + ')');
        }
  
        if (uiw._values.fetchLovMode === 'DIALOG' &&
           Number($(uiw._values.ajaxReturn).attr('data-fetch-lov-id')) !== uiw._elements.$wrapper.data('fetchLovId')
        ){
           if (uiw.options.debug){
              apex.debug('...Ajax return mismatch - exiting early');
           }
  
         // ApEx 5 Adjustment : added following row
         uiw._elements.$dialog.css('height','auto');
  
           return;//Ajax return was not meant for the current modal dialog (user may have opened/closed/opened)
        }
        
        resultsReturned = $ajaxReturn.find('tr').length - 1; //minus one for table headers
        
        if (uiw._values.fetchLovMode === 'ENTERABLE') {
           uiw._elements.$fieldset.next('span.loading-indicator').remove();
           
           if (resultsReturned === 1) {
              if (uiw.options.debug){
                 apex.debug('...Found exact match, setting display and return inputs');
              }
              
              uiw._values.fetchLovInProcess = false;
              uiw._elements.$selectedRow = $ajaxReturn.find('tr:eq(1)');//Second row is the match
              uiw._setValuesFromRow();
  
  
              return;
           } else {
              if (uiw.options.debug){
                 apex.debug('...Exact match not found, opening dialog');
              }
              
              uiw._elements.$hiddenInput.val('');
              uiw._elements.$displayInput.val('');
              uiw._values.lastDisplayValue = '';
  
              uiw._showDialog();
           }
        }
        
        uiw._elements.$wrapper
           .fadeTo(0, 0)
           .css({
               // 'width':'100000px',
               // ApEx 5 Adjustment : remove following line
              'height':'0px',
              'overflow':'hidden'//Webkit wants hide then show scrollbars
           })
           .empty();
        
        if (resultsReturned === 0) {
           noDataFoundMsg =
                 '<div class="ui-widget superlov-nodata">\n'
              +  '   <div class="ui-state-highlight ui-corner-all" style="padding: 0pt 0.7em;">\n'
              +  '      <p>\n'
              +  '      <span class="ui-icon ui-icon-alert" style="float: left; margin-right:0.3em;"></span>\n'
              +  '      ' + uiw.options.noDataFoundMsg + '\n'
              +  '      </p>\n'
              +  '   </div>\n'
              +  '</div>\n';
  
           uiw._elements.$wrapper.html(noDataFoundMsg);
  
        } else {
           uiw._elements.$wrapper.html(uiw._values.ajaxReturn);
           
           $('table.superlov-table th:first').addClass('ui-corner-tl');
           $('table.superlov-table th:last').addClass('ui-corner-tr');
           $('table.superlov-table tr:last td:first').addClass('ui-corner-bl');
           $('table.superlov-table tr:last td:last').addClass('ui-corner-br');
        }
  
        uiw._ieNoSelectText();
        uiw._initTransientElements();
        uiw._values.moreRows =
           (uiw._elements.$moreRows.val() === 'Y') ? true : false;
  
        uiw._highlightSelectedRow();
  
        uiw._updatePaginationDisplay();
  
        uiw._enableSearchButton();
  
        if (uiw._values.moreRows) {
           uiw._enableNextButton();
        } else {
           uiw._disableNextButton();
        }
  
        if (uiw._elements.$table.length) {
           apex.debug('wrapper width: ' + uiw._elements.$wrapper.width());
           apex.debug('table width: ' + uiw._elements.$table.width());
           uiw._elements.$table.width(uiw._elements.$table.width());
        }
        else if (uiw._elements.$nodata.length) {
           uiw._elements.$nodata.width(uiw._elements.$nodata.width());
        }
  
        uiw._resizeModal();
        uiw._values.fetchLovInProcess = false;
  
      // ApEx 5 Adjustment : added following line
      uiw._elements.$dialog.css('height','auto');
  
     },
     _resizeModal: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Resize Modal (' + uiw._values.apexItemId + ')');
        }
  
        uiw._updateLovMeasurements();
  
  // ApEx 5 Adjustment : added following row
         uiw._elements.$dialog.css('height','auto');
  
        if (uiw.options.effectsSpeed === 0) {//had to create separate block, animate with 0 was choppy with large tables
           uiw._elements.$outerDialog.css({
              'height': uiw._values.dialogHeight,
              'width': uiw._values.dialogWidth,
              'left': uiw._values.dialogLeft
           });
           
           if (uiw._elements.$nodata.length) {
              uiw._elements.$nodata.width(uiw._values.wrapperWidth);
           }
  
           uiw._elements.$wrapper.css({
              'height':uiw._values.wrapperHeight,
              'width':uiw._values.wrapperWidth,
              'overflow':'auto'//Webkit wants hide then show scrollbars
           })
           .fadeTo(uiw.options.effectsSpeed, 1);
  
           uiw._elements.$window.bind('resize', {uiw: uiw}, uiw._handleWindowResize);
        } else {
           uiw._elements.$outerDialog.animate(
              {height: uiw._values.dialogHeight},
              uiw.options.effectsSpeed,
              function() {
                 uiw._elements.$outerDialog.animate({
                       width: uiw._values.dialogWidth,
                       left: uiw._values.dialogLeft
                    },
                    uiw.options.effectsSpeed,
                    function() {
                       if (uiw._elements.$nodata.length) {
                          uiw._elements.$nodata.width(uiw._values.wrapperWidth);
                       }
  
                       uiw._elements.$wrapper.css({
                          'height':uiw._values.wrapperHeight,
                          'width':uiw._values.wrapperWidth,
                          'overflow':'auto'//Webkit wants hide then show scrollbars
                       })
                       .fadeTo(uiw.options.effectsSpeed, 1);
  
                       uiw._elements.$window.bind('resize', {uiw: uiw}, uiw._handleWindowResize);
                    }
                 );
              }
           );
        }
     },
     _search: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Search (' + uiw._values.apexItemId + ')');
        }
  
        uiw._values.curPage = 1;
        uiw._values.pagination = '1:' + uiw.options.maxRowsPerPage;
  
        if (uiw._elements.$filter.val() === '') {
           uiw._elements.$columnSelect.val('');
           uiw._handleColumnChange();
        }
  
        uiw._disablePrevButton();
        uiw._values.fetchLovMode = 'DIALOG';
        uiw._fetchLov();
     },
     _updatePaginationDisplay: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Update Pagination Display (' + uiw._values.apexItemId + ')');
        }
  
        uiw._elements.$paginationDisplay.html('Page ' + uiw._values.curPage);
     },
     _disableSearchButton: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Disable Search Button (' + uiw._values.apexItemId + ')');
        }
  
        uiw._disableButton('search');
     },
     _disablePrevButton: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Disable Prev Button (' + uiw._values.apexItemId + ')');
        }
  
        uiw._disableButton('prev');
     },
     _disableNextButton: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Disable Next Button (' + uiw._values.apexItemId + ')');
        }
  
        uiw._disableButton('next');
     },
     _disableButton: function(which) {
        var uiw = this;
        var $button;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Disable Button (' + uiw._values.apexItemId + ')');
        }
  
        if (which == 'search') {
           $button = uiw._elements.$searchButton;
           
           $button
              .attr('disabled','disabled')
              .removeClass('ui-state-hover') //User may be hovering over button
              .removeClass('ui-state-focus')
              .css('cursor', 'default');
           
           return;
        } else if (which == 'prev') {
           $button = uiw._elements.$prevButton;
        } else if (which == 'next') {
           $button = uiw._elements.$nextButton;
        }
  
        $button
           .attr('disabled','disabled')
           .removeClass('ui-state-hover') //User may be hovering over button
           .removeClass('ui-state-focus')
           .css({
              'opacity':'0.5',
              'cursor':'default'
           });
     },
     _enableSearchButton: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Enable Search Button (' + uiw._values.apexItemId + ')');
        }
  
        uiw._enableButton('search');
     },
     _enablePrevButton: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Enable Prev Button (' + uiw._values.apexItemId + ')');
        }
  
        uiw._enableButton('prev');
     },
     _enableNextButton: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Enable Next Button (' + uiw._values.apexItemId + ')');
        }
  
        uiw._enableButton('next');
     },
     _enableButton: function(which) {
        var uiw = this;
        var $button;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Enable Button (' + uiw._values.apexItemId + ')');
        }
  
        if (which == 'search') {
           $button = uiw._elements.$searchButton;
           
           $button
           .removeAttr('disabled')
           .css('cursor', 'pointer');
           
           return;
        } else if (which == 'prev') {
           $button = uiw._elements.$prevButton;
        } else if (which == 'next') {
           $button = uiw._elements.$nextButton;
        }
  
        $button
           .removeAttr('disabled')
           .css({
              'opacity':'1',
              'cursor':'pointer'
           });
     },
     _highlightSelectedRow: function() {
        var uiw = this;
        var $tblRow = $('table.superlov-table tbody tr[data-return="'
           + uiw._elements.$hiddenInput.val() + '"]');
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Highlight Selected Row (' + uiw._values.apexItemId + ')');
        }
  
        $tblRow.children('td')
           .removeClass('ui-state-default')
           .addClass('ui-state-active');
     },
     _handleMainTrMouseenter: function(eventObj) {
        var uiw = eventObj.data.uiw;
        var $tblRow = $(eventObj.currentTarget); //currentTarget w/live
        var $current = uiw._elements.$table.find('tbody>tr').has('td.ui-state-hover');
        
        if (uiw.options.debug){
           apex.debug('Super LOV: _handleMainTrMouseenter (' + uiw._values.apexItemId + ')');
        }
        
        if($current.length) {
           if($current.children('td.ui-state-hover-active').length) {
              $current.children('td')
                 .removeClass('ui-state-hover ui-state-hover-active')
                 .addClass('ui-state-active');
           }
           else {
              $current.children('td')
                 .removeClass('ui-state-hover')
                 .addClass('ui-state-default');
           }
        }
  
        if($tblRow.children('td:not(.ui-state-active)').length) {
           //Not Active
           $tblRow.children('td')
              .removeClass('ui-state-default')
              .addClass('ui-state-hover');
        }
        else {
          //Active
          $tblRow.children('td')
              .removeClass('ui-state-active')
              .addClass('ui-state-hover ui-state-hover-active');
        }
           
     },
     _handleMainTrMouseleave: function(eventObj) {
        var uiw = eventObj.data.uiw;
        var $tblRow = $(eventObj.currentTarget); //currentTarget w/live
        
        if (uiw.options.debug){
           apex.debug('Super LOV: _handleMainTrMouseleave (' + uiw._values.apexItemId + ')');
        }
        
        if($tblRow.children('td.ui-state-hover-active').length) {
           $tblRow.children('td')
              .removeClass('ui-state-hover ui-state-hover-active')
              .addClass('ui-state-active');
        }
        else {
           $tblRow.children('td')
              .removeClass('ui-state-hover')
              .addClass('ui-state-default');
        }
     },
     _handleMainTrClick: function(eventObj) {
        var uiw = eventObj.data.uiw;
        uiw._elements.$selectedRow = $(eventObj.currentTarget); //currentTarget w/live
        
        uiw._setValuesFromRow();
     },
     _setValuesFromRow: function() {
        var uiw = this;
        var valChanged;
        var returnVal = uiw._elements.$selectedRow.attr('data-return');
        var displayVal = uiw._elements.$selectedRow.attr('data-display');
        if (uiw.options.debug){
           apex.debug('Super LOV - Set values from row (' + uiw._values.apexItemId + ')');
           apex.debug('...returnVal: "' + returnVal + '"');
           apex.debug('...displayVal: "' + displayVal + '"');
        }
  
        valChanged = uiw._elements.$hiddenInput.val() !== returnVal;
        
        if (uiw.options.debug){
           apex.debug('...valChanged: "' + valChanged + '"');
        }
  
        uiw._elements.$hiddenInput.val(returnVal);
        uiw._elements.$displayInput.val(displayVal);
        uiw._values.lastDisplayValue = displayVal;
        
        for (x = 0; x < uiw._values.mapToItems.length; x++) {
           if (uiw._isHiddenCol(uiw._values.mapFromCols[x])) {
              $s(uiw._values.mapToItems[x], uiw._elements.$selectedRow.attr('data-col' + uiw._values.mapFromCols[x] + '-value'));
           } else {
              $s(uiw._values.mapToItems[x], uiw._elements.$selectedRow.children('td.asl-col' + uiw._values.mapFromCols[x]).text());
           }
        }
  
        if (uiw._values.fetchLovMode === 'DIALOG') {
           if (uiw.options.debug){
              apex.debug('...In dialog mode; close dialog');
           }
  
           // greg j 2015-06-07 need to close the instance of the dialog that is created by the call to dialog('open')
           var dialog = $( "div.superlov-container" ).data( "ui-dialog" );
           if (dialog) {
              dialog.close();
           }
  
        }
  
        if (valChanged) {
           uiw.allowChangePropagation();
           uiw._elements.$hiddenInput.trigger('change');
           uiw._elements.$displayInput.trigger('change');
           uiw.preventChangePropagation();
        }
     },
     _handleSearchButtonClick: function(eventObj) {
        var uiw = eventObj.data.uiw;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Handle Search Button Click (' + uiw._values.apexItemId + ')');
        }
  
        uiw._search();
     },
     _handlePrevButtonClick: function(eventObj) {
        var uiw = eventObj.data.uiw;
        var fromRow;
        var toRow;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Handle Prev Button Click (' + uiw._values.apexItemId + ')');
        }
  
        uiw._values.fetchLovMode = 'DIALOG';
        uiw._values.curPage = uiw._values.curPage - 1;
  
        if (uiw._values.curPage === 1) {
           fromRow = 1 ;
           toRow = uiw.options.maxRowsPerPage;
  
           uiw._values.pagination = fromRow + ':' + toRow;
  
           uiw._fetchLov();
           uiw._disablePrevButton();
        } else {
           fromRow = ((uiw._values.curPage-1) * uiw.options.maxRowsPerPage) + 1;
           toRow = uiw._values.curPage * uiw.options.maxRowsPerPage;
  
           uiw._values.pagination = fromRow + ':' + toRow;
  
           uiw._fetchLov();
           uiw._enablePrevButton();
        }
     },
     _handleNextButtonClick: function(eventObj) {
        var uiw = eventObj.data.uiw;
        var fromRow;
        var toRow;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Handle Next Button Click (' + uiw._values.apexItemId + ')');
        }
  
        uiw._values.fetchLovMode = 'DIALOG';
        uiw._values.curPage = uiw._values.curPage + 1;
        fromRow = ((uiw._values.curPage-1) * uiw.options.maxRowsPerPage) + 1;
        toRow = uiw._values.curPage * uiw.options.maxRowsPerPage;
        uiw._values.pagination = fromRow + ':' + toRow;
  
        uiw._fetchLov();
  
        uiw._elements.$paginationDisplay.html('Page ' + uiw._values.curPage);
  
        if (
           uiw._values.curPage >= 2
           && uiw._elements.$prevButton.attr('disabled')
        ) {
           uiw._enablePrevButton();
        }
     },
     _refresh: function() {
        var uiw = this;
        var curVal = uiw._elements.$hiddenInput.val();
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Refresh (' + uiw._values.apexItemId + ')');
        }
        
        uiw._elements.$displayInput.trigger('apexbeforerefresh');
  
        uiw._elements.$hiddenInput.val('');
        uiw._elements.$displayInput.val('');
        uiw._values.lastDisplayValue = '';
        
        for (x = 0; x < uiw._values.mapToItems.length; x++) {
           $s(uiw._values.mapToItems[x], '');
        }
        
        uiw._elements.$displayInput.trigger('apexafterrefresh');
        
        if (curVal !== uiw._elements.$hiddenInput.val()) {
           uiw.allowChangePropagation();
           uiw._elements.$hiddenInput.trigger('change');
           uiw._elements.$displayInput.trigger('change');
           uiw.preventChangePropagation();
        }
  
        return false;
     },
     _updateLovMeasurements: function() {
        var uiw = this;
        var $innerElement
        var accountForScrollbar = 25;
        var hasVScroll = false;
        var hasHScroll = false;
        var calculateWidth = true;
  
        var baseDialogHeight;
        var maxHeight;
        var wrapperHeight;
  
        var baseWidth;
        var minWidth;
        var maxWidth;
        var wrapperWidth;
  
        var dialogWidth;
        var dialogHeight;
  
        var moveBy;
        var leftPos;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Update LOV Measurements (' + uiw._values.apexItemId + ')');
        }
  
        if (!uiw._elements.$nodata.length) {
           $innerElement = uiw._elements.$table;
        }
        else {
           calculateWidth = false;
           $innerElement = uiw._elements.$nodata;
        }
  
        baseDialogHeight =
           $('div.superlov-dialog div.ui-dialog-titlebar').outerHeight(true)
           + uiw._elements.$buttonContainer.outerHeight(true)
           + $('div.superlov-dialog div.ui-dialog-buttonpane').outerHeight(true)
           + (uiw._elements.$dialog.outerHeight(true)
              - uiw._elements.$dialog.height())
           + (uiw._elements.$wrapper.outerHeight(true)
              - uiw._elements.$wrapper.height());
  
        maxHeight = uiw._elements.$outerDialog.css('max-height');
        if (uiw._values.percentRegExp.test(maxHeight)) {
           maxHeight = parseFloat(maxHeight);
  
           maxHeight = uiw._elements.$window.height() * (maxHeight/100);
        }
        else if (uiw._values.pixelRegExp.test(maxHeight)) {
           maxHeight = parseFloat(maxHeight);
        }
        else {
           maxHeight = uiw._elements.$window.height() * .9;
        }
        //TEMPORARY FIX.  IE not getting correct value when selecting the
        //CSS max-height value.
        maxHeight = uiw._elements.$window.height() * .9;
  
        baseWidth = uiw._elements.$dialog.outerWidth(true)
           - uiw._elements.$dialog.width();
  
        minWidth = uiw._elements.$outerDialog.css('min-width');
        if (uiw._values.percentRegExp.test(minWidth)) {
           minWidth = parseFloat(minWidth);
  
           minWidth = uiw._elements.$window.width() * (minWidth/100);
        }
        else if (uiw._values.pixelRegExp.test(minWidth)) {
           minWidth = parseFloat(minWidth);
        }
        else {
           minWidth = uiw._elements.$buttonContainer.outerWidth(true);
        }
  
        maxWidth = uiw._elements.$outerDialog.css('max-width');
        if (uiw._values.percentRegExp.test(maxWidth)) {
           maxWidth = parseFloat(maxWidth);
  
           maxWidth = uiw._elements.$window.width() * (maxWidth/100);
        }
        else if (uiw._values.pixelRegExp.test(maxWidth)) {
           maxWidth = parseFloat(maxWidth);
        }
        else {
           maxWidth = uiw._elements.$window.width() * .9;
        }
        //TEMPORARY FIX.  IE not getting correct value when selecting the
        //CSS max-width value.
        maxWidth = uiw._elements.$window.width() * .9;
  
        if (baseDialogHeight + $innerElement.outerHeight(true) > maxHeight) {
           hasVScroll = true;
           wrapperHeight = maxHeight - baseDialogHeight;
        }
        else {
           wrapperHeight = $innerElement.outerHeight(true);
        }
  
        if (calculateWidth) {
           wrapperWidth = $innerElement.outerWidth(true);
           if (hasVScroll) {
              wrapperWidth = wrapperWidth + accountForScrollbar;
           }
  
           if (baseWidth + wrapperWidth < minWidth) {
              wrapperWidth = minWidth - baseWidth;
           }
           else if (baseWidth + wrapperWidth > maxWidth) {
              hasHScroll = true;
              wrapperWidth = maxWidth - baseWidth;
  
              if (wrapperWidth < minWidth) {
                 wrapperWidth = minWidth - baseWidth;
              }
           }
  
           if (hasHScroll && ! hasVScroll) {
              if (baseDialogHeight + $innerElement.outerHeight(true) + accountForScrollbar > maxHeight) {
                 hasVScroll = true;
                 wrapperHeight = maxHeight - baseDialogHeight;
              }
              else {
                 wrapperHeight =
                    $innerElement.outerHeight(true)
                    + accountForScrollbar;
              }
           }
        }
        else {
           wrapperWidth = minWidth - baseWidth;
        }
  
        dialogHeight = baseDialogHeight + wrapperHeight;
        dialogWidth = baseWidth + wrapperWidth;
  
        uiw._values.wrapperHeight = wrapperHeight;
        uiw._values.wrapperWidth = wrapperWidth;
        uiw._values.dialogHeight = dialogHeight;
        uiw._values.dialogWidth = dialogWidth;
  
        moveBy =
           (uiw._values.dialogWidth - uiw._elements.$outerDialog.width())/2;
        leftPos = uiw._elements.$outerDialog.css('left');
        if (uiw._values.percentRegExp.test(leftPos)) {
           leftPos = parseFloat(leftPos);
  
           leftPos = uiw._elements.$window.width() * (leftPos/100);
        }
        else if (uiw._values.pixelRegExp.test(leftPos)) {
           leftPos = parseFloat(leftPos);
        }
        else {
           leftPos = 0;
        }
  
        leftPos = leftPos - moveBy;
  
        if(leftPos < 0) {
           leftPos = 0;
        }
  
        uiw._values.dialogLeft = leftPos;
        uiw._values.dialogTop =
          uiw._elements.$window.height()*.05 + $(document).scrollTop();
     },
     _updateStyledFilter: function() {
        var uiw = this;
        var backColor = uiw._elements.$filter.css('background-color');
        var backImage = uiw._elements.$filter.css('background-image');
        var backRepeat = uiw._elements.$filter.css('background-repeat');
        var backAttachment = uiw._elements.$filter.css('background-attachment');
        var backPosition = uiw._elements.$filter.css('background-position');
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Update Styled Filter (' + uiw._values.apexItemId + ')');
        }
  
        $('#superlov_styled_filter').css({
           'background-color':backColor,
           'background-image':backImage,
           'background-repeat':backRepeat,
           'background-attachment':backAttachment,
           'background-position':backPosition
        });
     },
     _updateStyledInput: function() {
        var uiw = this;
       var backColor = uiw._elements.$displayInput.css('background-color');
       var backImage = uiw._elements.$displayInput.css('background-image');
       var backRepeat = uiw._elements.$displayInput.css('background-repeat');
       var backAttachment = uiw._elements.$displayInput.css('background-attachment');
       var backPosition = uiw._elements.$displayInput.css('background-position');
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Update Styled Input (' + uiw._values.apexItemId + ')');
        }
  
       uiw._elements.$fieldset.css({
          'background-color':backColor,
          'background-image':backImage,
          'background-repeat':backRepeat,
          'background-attachment':backAttachment,
          'background-position':backPosition
       });
     },
     _handleClearClick: function(eventObj) {
        var uiw = eventObj.data.uiw;
        var $icon = uiw._elements.$clearButton.find('span.ui-icon');
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Clear LOV (' + uiw._values.apexItemId + ')');
        }
        
        if(eventObj.screenX !== 0 && eventObj.screenY !== 0) {//Triggered by mouse
           eventObj.target.blur();
        }
        
        if (uiw._elements.$displayInput.val() !== '') {
           if (uiw.options.useClearProtection === 'N') {
              uiw._refresh();
           } else {
              if($icon.hasClass('ui-icon-circle-close')) {
                 $icon
                    .removeClass('ui-icon-circle-close')
                    .addClass('ui-icon-alert');
  
                 uiw._values.deleteIconTimeout = setTimeout("$('#" + uiw._values.controlsId + " button>span.ui-icon-alert').removeClass('ui-icon-alert').addClass('ui-icon-circle-close');", 1000);
              }
              else {
                 clearTimeout(uiw._values.deleteIconTimeout);
                 uiw._values.deleteIconTimeout = '';
                 
                 uiw._refresh();
                 
                 $icon
                    .removeClass('ui-icon-alert')
                    .addClass('ui-icon-circle-close');
              }
           }
        }
     },
     _disableArrowKeyScrolling: function(eventObj) {
        var uiw = eventObj.data.uiw;
        var key = eventObj.which;
        
        //Left or right arrow keys
        if (key === 37 || key === 39) {
           if(uiw._values.bodyKeyMode === 'ROWSELECT') {
              eventObj.preventDefault();
              return false;
           }
        }
        //Up or down arrow keys
        else if (key === 38 || key === 40) {
           eventObj.preventDefault();
           return false;
        }
        return true;
     },
     _handleFilterFocus: function(eventObj) {
        var uiw = eventObj.data.uiw;
        
        uiw._values.bodyKeyMode = 'SEARCH';
     },
     disable: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Disabling Item (' + uiw._values.apexItemId + ')');
        }
        
        if (uiw._values.disabled === false) {
           if (uiw.options.enterable === uiw._values.ENTERABLE_RESTRICTED
              || uiw.options.enterable === uiw._values.ENTERABLE_UNRESTRICTED
           ) {
              uiw._elements.$displayInput
                 .attr('disabled','disabled')
                 .unbind('keypress', uiw._handleEnterableKeypress)
                 .unbind('blur', {uiw: uiw}, uiw._handleEnterableBlur);
           }
           
           uiw._elements.$hiddenInput.attr('disabled','disabled');
        
           uiw._elements.$openButton.unbind('click', uiw._handleOpenClick);
           uiw._elements.$clearButton.unbind('click', uiw._handleClearClick);
           uiw._elements.$itemHolder
              .find('div.superlov-controls-buttons').buttonset('disable');
        }
        
        uiw._values.disabled = true;
  
  // ApEx 5 Adjustment : added following two lines
      uiw._elements.$label.parent().addClass('apex_disabled');
      uiw._elements.$fieldset.parent().addClass('apex_disabled');
  
     },
     enable: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Enabling Item (' + uiw._values.apexItemId + ')');
        }
        
        if (uiw._values.disabled === true) {
           if (uiw.options.enterable === uiw._values.ENTERABLE_RESTRICTED
              || uiw.options.enterable === uiw._values.ENTERABLE_UNRESTRICTED
           ) {
              uiw._elements.$displayInput
                 .removeAttr('disabled')
                 .bind('keypress', {uiw: uiw}, uiw._handleEnterableKeypress)
                 .bind('blur', {uiw: uiw}, uiw._handleEnterableBlur);
           }
           
           uiw._elements.$hiddenInput.removeAttr('disabled');
        
           uiw._elements.$openButton.bind('click', {uiw: uiw}, uiw._handleOpenClick);
           uiw._elements.$clearButton.bind('click', {uiw: uiw}, uiw._handleClearClick);
           uiw._elements.$itemHolder
              .find('div.superlov-controls-buttons').buttonset('enable');
        }
        
        uiw._values.disabled = false;
  
  // ApEx 5 Adjustment : added following two lines
      uiw._elements.$label.parent().removeClass('apex_disabled');
      uiw._elements.$fieldset.parent().removeClass('apex_disabled');
  
     },
     hide: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Hiding Item (' + uiw._values.apexItemId + ')');
        }
        
        uiw._elements.$fieldset.hide();
        uiw._elements.$label.hide();
     },
     show: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Showing Item (' + uiw._values.apexItemId + ')');
        }
     
        uiw._elements.$fieldset.show();
        uiw._elements.$label.show();
     },
     hideRow: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Hiding Row (' + uiw._values.apexItemId + ')');
        }
        
  // ApEx 5 Adjustment : added following code to hide based on responsive or non-responsive
      if ( uiw._elements.$label.parent().prop('tagName').toLowerCase() === "td" )
      { uiw._elements.$label.closest('tr').hide(); }
      else
      { // hide the row when the element is configured to be in same row, but not same column
          uiw._elements.$fieldset.closest('.apex_row').hide();
      // hide the row when the element is configured to be in a new row or
      //        in the same row and in the same column
          uiw._elements.$fieldset.closest('.fieldContainer').hide(); }
     },
     showRow: function() {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Showing Row (' + uiw._values.apexItemId + ')');
        }
        
  // ApEx 5 Adjustment : added following code to show based on responsive or non-responsive
      if ( uiw._elements.$label.parent().prop('tagName').toLowerCase() === "td" )
      { uiw._elements.$label.closest('tr').show(); }
      else
      { // show the row when the element is configured to be in same row, but not same column
          uiw._elements.$fieldset.closest('.apex_row').show();
      // show the row when the element is configured to be in a new row or
      //        in the same row and in the same column
          uiw._elements.$fieldset.closest('.fieldContainer').show(); }
     },
     allowChangePropagation: function() {
        var uiw = this;
     
        uiw._values.changePropagationAllowed = true;
     },
     preventChangePropagation: function() {
        var uiw = this;
     
        uiw._values.changePropagationAllowed = false;
     },
     changePropagationAllowed: function() {
        var uiw = this;
        
        return uiw._values.changePropagationAllowed;
     },
     getValuesByReturn: function(queryRetVal) {
        var uiw = this;
        
        if (uiw.options.debug){
           apex.debug('Super LOV - Getting Values by Return Value (' + uiw._values.apexItemId + ')');
        }
        
        queryString = {
           p_flow_id: $('#pFlowId').val(),
           p_flow_step_id: $('#pFlowStepId').val(),
           p_instance: $('#pInstance').val(),
           p_request: 'PLUGIN=' + uiw.options.ajaxIdentifier,
           x01: 'GET_VALUES_BY_RETURN',
           x06: queryRetVal
        };
  
        $.ajax({
           type: 'POST',
           url: 'wwv_flow.show',
           data: queryString,
           dataType: 'json',
           async: false,
           success: function(result) {
              if (uiw.options.debug){
                 apex.debug(result);
              }
              
              uiw._values.ajaxReturn = result;
           }
        });
        
        return uiw._values.ajaxReturn;
     },
     setValuesByReturn: function(queryRetVal) {
        var uiw = this;
        var valuesObj;
        
        valuesObj = uiw.getValuesByReturn(queryRetVal);
        
        if (valuesObj.error !== undefined) {
           if (
              uiw._elements.$fieldset.hasClass('super-lov-not-enterable')
              || uiw._elements.$fieldset.hasClass('super-lov-enterable-restricted')
           ) {
              uiw._elements.$hiddenInput.val('');
              uiw._elements.$displayInput.val('');
              uiw._values.lastDisplayValue = '';
           }
           else if (uiw._elements.$fieldset.hasClass('super-lov-enterable-unrestricted')) {
              uiw._elements.$hiddenInput.val(queryRetVal);
              uiw._elements.$displayInput.val(queryRetVal);
              uiw._values.lastDisplayValue = queryRetVal;
           }
           
           for (x = 0; x < uiw._values.mapToItems.length; x++) {
              $s(uiw._values.mapToItems[x], '');
           }
        }
        else if (!valuesObj.matchFound) {
           if (
              uiw._elements.$fieldset.hasClass('super-lov-not-enterable') 
              || uiw._elements.$fieldset.hasClass('super-lov-enterable-restricted')
           ) {
              uiw._elements.$hiddenInput.val('');
              uiw._elements.$displayInput.val('');
              uiw._values.lastDisplayValue = '';
           }
           else if (uiw._elements.$fieldset.hasClass('super-lov-enterable-unrestricted')) {
              uiw._elements.$hiddenInput.val(queryRetVal);
              uiw._elements.$displayInput.val(queryRetVal);
              uiw._values.lastDisplayValue = queryRetVal;
           }
           
           for (x = 0; x < uiw._values.mapToItems.length; x++) {
              $s(uiw._values.mapToItems[x], '');
           }
        }
        else {
           uiw._elements.$hiddenInput.val(valuesObj.returnVal);
           uiw._elements.$displayInput.val(valuesObj.displayVal);
           uiw._values.lastDisplayValue = valuesObj.displayVal;
           
           if (valuesObj.mappedColumns) {
              for (x = 0; x < valuesObj.mappedColumns.length; x++) {
                 $s(valuesObj.mappedColumns[x].mapItem, valuesObj.mappedColumns[x].mapVal);
              }
           }
        }
     }
  });
  })($);