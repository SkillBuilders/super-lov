CREATE OR REPLACE PACKAGE body apex_super_lov_3_0
IS

  PROCEDURE apex_super_lov_render (

    p_item   in            apex_plugin.t_item,
    p_plugin in            apex_plugin.t_plugin,
    p_param  in            apex_plugin.t_item_render_param,
    p_result in out nocopy apex_plugin.t_item_render_result   
  )
    
  IS

    lc_not_enterable          CONSTANT VARCHAR2(30) := 'NOT_ENTERABLE';
    lc_enterable_unrestricted CONSTANT VARCHAR2(30) := 'ENTERABLE_UNRESTRICTED';
    lc_enterable_restricted   CONSTANT VARCHAR2(30) := 'ENTERABLE_RESTRICTED';
    l_name                    VARCHAR2(30);
    l_dialog_title            VARCHAR2(32767) := NVL(p_item.attribute_02, p_item.plain_label);
    l_dis_ret_cols            VARCHAR2(10) := NVL(p_item.attribute_03, '2,1');
    l_searchable_cols         VARCHAR2(32767) := p_item.attribute_04;
    l_hidden_cols             VARCHAR2(32767) := p_item.attribute_05;
    l_map_from_cols           VARCHAR2(32767) := p_item.attribute_06;
    l_map_to_items            VARCHAR2(32767) := p_item.attribute_07;
    l_enterable               VARCHAR2(30) := NVL(p_item.attribute_08, lc_not_enterable);
    l_max_rows_per_page       PLS_INTEGER := NVL(p_item.attribute_09, 15);
    l_search_type             VARCHAR2(32767) := NVL(p_plugin.attribute_01, apex_plugin_util.c_search_contains_ignore);
    l_loading_image_type      VARCHAR2(30) := NVL(p_plugin.attribute_03, 'DEFAULT');
    l_loading_image_def       VARCHAR2(30) := NVL(p_plugin.attribute_04, 'bar');
    l_loading_image_cust      VARCHAR2(32767) := NVL(p_plugin.attribute_05, apex_application.g_image_prefix || 'img/processing3.gif');
    l_effects_speed           NUMBER := NVL(p_plugin.attribute_06, 400);
    l_clear_protection        VARCHAR2(1) := NVL(p_plugin.attribute_07, 'Y');
    l_no_data_found_msg       VARCHAR2(32767) := NVL(p_plugin.attribute_08, 'Your search returned no results.');
    l_return_col_num          PLS_INTEGER;
    l_display_col_num         PLS_INTEGER;
    l_loading_image_src       VARCHAR2(32767);
    l_display_value           VARCHAR2(32767);
    l_onload_code             VARCHAR2(32767);
    l_sql_handler             APEX_PLUGIN_UTIL.T_SQL_HANDLER;
    l_display_values          WWV_FLOW_GLOBAL.VC_ARR2;
    l_search_values           WWV_FLOW_GLOBAL.VC_ARR2;
    l_js_headers_array        VARCHAR2(32767);
    l_crlf                    CHAR(2) := CHR(13)||CHR(10);
    
    l_apex_version            pls_integer;
    l_button_classes          varchar2(255);
    l_input_classes           varchar2(255);
    l_inner_container_classes varchar2(255);
    l_container_classes       varchar2(255);
    
    
    
  BEGIN

    IF apex_application.g_debug
    THEN
        apex_plugin_util.debug_page_item (
          p_plugin              => p_plugin,
          p_page_item           => p_item,
          p_value               => p_param.value,
          p_is_readonly         => p_param.is_readonly,
          p_is_printer_friendly => p_param.is_printer_friendly
        );
    END IF;
    
    SELECT substr(VERSION_NO,1,instr(version_no,'.')-1) into l_apex_version FROM APEX_RELEASE;
    
    l_input_classes     := ' popup_lov apex-item-text apex-item-popup-lov ';
    
    if l_apex_version >= 18 then
    
      l_button_classes    := ' a-Button a-Button--popupLOV ';
      l_container_classes := ' superlov-controls--stretch ';
      l_inner_container_classes := ' apex-item-group apex-item-group--popup-lov ';

    end if;
    
    IF l_loading_image_type = 'DEFAULT'
    THEN
        l_loading_image_src := p_plugin.file_prefix ||'img/'|| l_loading_image_def || '.gif';
    ELSE
        l_loading_image_src := REPLACE(l_loading_image_cust, '#IMAGE_PREFIX#', apex_application.g_image_prefix);
        l_loading_image_src := REPLACE(l_loading_image_src, '#PLUGIN_PREFIX#', p_plugin.file_prefix);
    END IF;
    
    l_display_col_num := SUBSTR(l_dis_ret_cols, 1, INSTR(l_dis_ret_cols, ',') - 1);
    
    IF l_searchable_cols IS NOT NULL
        AND INSTR(',' || l_searchable_cols || ',', ',' || l_display_col_num || ',') = 0
    THEN
        --User forgot to add display column as a searchable column, let's do it for them
        l_searchable_cols := l_display_col_num || ',' || l_searchable_cols;
    END IF;
    
    IF l_hidden_cols IS NOT NULL
    THEN
        l_hidden_cols := ',' || l_hidden_cols || ',';
        
        IF INSTR(l_hidden_cols, ',' || l_display_col_num || ',') > 0
        THEN
          --User marked display column as hidden, let's remove it for them
          l_hidden_cols := REPLACE(l_hidden_cols, ',' || l_display_col_num || ',', '');
        END IF;
        
        l_hidden_cols := TRIM(BOTH ',' FROM l_hidden_cols);
    END IF;
    
    l_return_col_num := SUBSTR(l_dis_ret_cols, INSTR(l_dis_ret_cols, ',') + 1);
    l_search_values(1) := p_param.value;

    l_sql_handler := apex_plugin_util.get_sql_handler (
        p_sql_statement  => p_item.lov_definition,
        p_min_columns    => 2,
        p_max_columns    => 100,
        p_component_name => p_item.name
    ); 
    
    l_display_values := apex_plugin_util.get_display_data(
        p_sql_handler       => l_sql_handler,
        p_display_column_no => l_display_col_num,
        p_search_column_no  => l_return_col_num,
        p_search_value_list => l_search_values,
        p_display_extra     => p_item.lov_display_extra 
    );
    
    IF l_display_values.exists(1) 
    THEN
        l_display_value := l_display_values(1);
    ELSIF l_enterable = lc_enterable_unrestricted
    THEN
        l_display_value := p_param.value;
    END IF;
    
    l_js_headers_array := '[''';
    
    FOR x IN 1 .. l_sql_handler.column_list.count
    LOOP
        l_js_headers_array := l_js_headers_array || apex_javascript.escape(l_sql_handler.column_list(x).col_name) || ''',''';
    END LOOP;
    
    l_js_headers_array := RTRIM(l_js_headers_array, ''',''') || ''']';
    
    apex_plugin_util.free_sql_handler(l_sql_handler);

    IF p_param.is_readonly OR p_param.is_printer_friendly
    THEN
        apex_plugin_util.print_hidden_if_readonly (
          p_item_name           => p_item.name,
          p_value               => p_param.value,
          p_is_readonly         => p_param.is_readonly,
          p_is_printer_friendly => p_param.is_printer_friendly
        );
        
        apex_plugin_util.print_display_only (
          p_item_name        => p_item.name,
          p_display_value    => l_display_value,
          p_show_line_breaks => FALSE,
          p_escape           => TRUE,
          p_attributes       => p_item.element_attributes
        );
    ELSE
        l_name := apex_plugin.get_input_name_for_page_item(FALSE);
        
        sys.htp.p(
              '<input type="hidden" name="' || l_name || '" id="' || p_item.name || '_HIDDENVALUE" value="' || sys.htf.escape_sc(p_param.value) || '" />' || l_crlf
          || '<fieldset id="' || p_item.name || '_fieldset" class="superlov-controls lov apex-item-popup-lov '|| l_container_classes  || 
              CASE l_enterable
                WHEN lc_not_enterable THEN 'super-lov-not-enterable'
                WHEN lc_enterable_unrestricted THEN 'super-lov-enterable-unrestricted'
                WHEN lc_enterable_restricted THEN 'super-lov-enterable-restricted'
              END
          || '">' || l_crlf
          || '   <div id="' || p_item.name || '_holder" class="superlov-controls-inner lov '|| l_inner_container_classes ||'">' || l_crlf
            || '               <input class="superlov-input apex-item-text '|| l_input_classes ||'" type="text" ' || 
                                CASE
                                    WHEN l_enterable = lc_not_enterable
                                    THEN 'disabled="disabled" onfocus="this.blur();"'
                                END
                              || ' value="' || sys.htf.escape_sc(l_display_value) || '" maxlength="' || p_item.element_max_length || '" size="'
                              || p_item.element_width || '" id="' || p_item.name || '" ' || p_item.element_attributes
                              || ' />' || l_crlf
          || '               <span class="superlov-controls-buttons">' || l_crlf
          || '                  <button type="button" class="superlov-modal-delete'|| l_button_classes ||'">&nbsp;</button>'
          || '                  <button type="button" class="superlov-modal-open'|| l_button_classes ||'">&nbsp;</button>' || l_crlf
          || '               </span>' || l_crlf
          || '                  ' || l_crlf
          || '     </div>' || l_crlf
          || '</fieldset>' || l_crlf
        );

        l_onload_code := 'apex.jQuery("input#' || p_item.name || '").apex_super_lov({' || l_crlf
          || '   ' || apex_javascript.add_attribute('enterable', l_enterable) || l_crlf
          || '   ' || apex_javascript.add_attribute('returnColNum', l_return_col_num) || l_crlf
          || '   ' || apex_javascript.add_attribute('displayColNum', l_display_col_num) || l_crlf
          || '   ' || apex_javascript.add_attribute('hiddenCols', sys.htf.escape_sc(l_hidden_cols)) || l_crlf
          || '   ' || apex_javascript.add_attribute('searchableCols', l_searchable_cols) || l_crlf
          || '   ' || apex_javascript.add_attribute('mapFromCols', l_map_from_cols) || l_crlf
          || '   ' || apex_javascript.add_attribute('mapToItems', l_map_to_items) || l_crlf
          || '   ' || apex_javascript.add_attribute('maxRowsPerPage', l_max_rows_per_page) || l_crlf
          || '   ' || apex_javascript.add_attribute('noDataFoundMsg', sys.htf.escape_sc(l_no_data_found_msg)) || l_crlf
          || '   ' || apex_javascript.add_attribute('dialogTitle', sys.htf.escape_sc(l_dialog_title)) || l_crlf
          || '   ' || apex_javascript.add_attribute('effectsSpeed', l_effects_speed) || l_crlf
          || '   ' || apex_javascript.add_attribute('useClearProtection', l_clear_protection) || l_crlf
          || '   ' || apex_javascript.add_attribute('loadingImageSrc', sys.htf.escape_sc(l_loading_image_src)) || l_crlf
          || '   ' || apex_javascript.add_attribute('dependingOnSelector', sys.htf.escape_sc(apex_plugin_util.page_item_names_to_jquery(p_item.lov_cascade_parent_items))) || l_crlf
          || '   ' || apex_javascript.add_attribute('pageItemsToSubmit', sys.htf.escape_sc(apex_plugin_util.page_item_names_to_jquery(p_item.ajax_items_to_submit))) || l_crlf
          || '   "ajaxIdentifier": "' || apex_plugin.get_ajax_identifier() || '",' || l_crlf
          || '   "reportHeaders": ' || l_js_headers_array || l_crlf
          || '});' || l_crlf
          || CASE 
                WHEN l_enterable IN (lc_enterable_unrestricted, lc_enterable_restricted)
                THEN '                  apex.jQuery("#' || p_item.name || '").bind("change", function(evnt) {' || l_crlf ||
                      '                     if (!apex.jQuery(this).apex_super_lov("changePropagationAllowed")) {' || l_crlf ||
                      '                        evnt.stopImmediatePropagation();' || l_crlf ||
                      '                     }' || l_crlf ||
                      '                  });' || l_crlf
              END
          || l_crlf;
          
        apex_javascript.add_onload_code(
          p_code => l_onload_code
        ); 
    END IF;

    IF l_enterable = lc_not_enterable
    THEN
        p_result.is_navigable := FALSE;
    ELSE
        p_result.is_navigable := TRUE;
    END IF;
          
  EXCEPTION

    WHEN OTHERS
    THEN
        apex_plugin_util.free_sql_handler(l_sql_handler);
      
  END apex_super_lov_render;

  PROCEDURE apex_super_lov_ajax (
      p_item   in            apex_plugin.t_item,
      p_plugin in            apex_plugin.t_plugin,
      p_param  in            apex_plugin.t_item_ajax_param,
      p_result in out nocopy apex_plugin.t_item_ajax_result
  )

  IS

    l_column_value_list APEX_PLUGIN_UTIL.T_COLUMN_VALUE_LIST2;     
    l_dis_ret_cols      VARCHAR2(10) := NVL(p_item.attribute_03, '2,1');
    l_searchable_cols   VARCHAR2(32767) := p_item.attribute_04;
    l_hidden_cols       VARCHAR2(32767) := p_item.attribute_05;
    l_map_from_cols     VARCHAR2(32767) := p_item.attribute_06;
    l_map_to_items      VARCHAR2(32767) := p_item.attribute_07;
    l_max_rows_per_page PLS_INTEGER := NVL(p_item.attribute_09, 15); 
    l_show_null_as      VARCHAR2(10) := NVL(p_item.attribute_10, '&nbsp;');
    l_map_from_parts    WWV_FLOW_GLOBAL.VC_ARR2;
    l_map_to_parts      WWV_FLOW_GLOBAL.VC_ARR2;
    l_search_type       VARCHAR2(32767) := NVL(p_plugin.attribute_01, apex_plugin_util.c_search_contains_ignore);
    l_return_col_num    PLS_INTEGER;
    l_display_col_num   PLS_INTEGER;
    l_lov_base_query    VARCHAR2(32767) := p_item.lov_definition;
    l_ajax_function     VARCHAR2(32767) := apex_application.g_x01;
    l_pagination        VARCHAR2(32767) := apex_application.g_x02;
    l_search_column_no  VARCHAR2(32767) := apex_application.g_x03;
    l_search_string     VARCHAR2(32767) := apex_application.g_x04;
    l_fetch_lov_id      NUMBER := apex_application.g_x05;
    l_return_val_search VARCHAR2(32767) := apex_application.g_x06;
    l_pagination_parts  WWV_FLOW_GLOBAL.VC_ARR2;
    l_crlf              CHAR(2) := CHR(13)||CHR(10);

    FUNCTION column_row_value (
        p_row           IN PLS_INTEGER,
        p_column_values IN APEX_PLUGIN_UTIL.T_COLUMN_VALUES
    )

        RETURN VARCHAR2

    IS

    BEGIN

        IF p_column_values.data_type = apex_plugin_util.c_data_type_varchar2
        THEN
          RETURN p_column_values.value_list(p_row).varchar2_value;
        ELSIF p_column_values.data_type = apex_plugin_util.c_data_type_number
        THEN
          RETURN p_column_values.value_list(p_row).number_value;
        ELSIF p_column_values.data_type = apex_plugin_util.c_data_type_date
        THEN
          RETURN p_column_values.value_list(p_row).date_value;
        ELSIF p_column_values.data_type = apex_plugin_util.c_data_type_timestamp
        THEN
          RETURN p_column_values.value_list(p_row).timestamp_value;
        ELSIF p_column_values.data_type = apex_plugin_util.c_data_type_timestamp_tz
        THEN
          RETURN p_column_values.value_list(p_row).timestamp_tz_value;
        ELSIF p_column_values.data_type = apex_plugin_util.c_data_type_timestamp_ltz
        THEN
          RETURN p_column_values.value_list(p_row).timestamp_ltz_value;
        ELSIF p_column_values.data_type = apex_plugin_util.c_data_type_interval_y2m
        THEN
          RETURN p_column_values.value_list(p_row).interval_y2m_value;
        ELSIF p_column_values.data_type = apex_plugin_util.c_data_type_interval_d2s
        THEN
          RETURN p_column_values.value_list(p_row).interval_d2s_value;
        ELSIF p_column_values.data_type = apex_plugin_util.c_data_type_blob
        THEN
          RETURN '[BLOB_DATATYPE]';
        ELSIF p_column_values.data_type = apex_plugin_util.c_data_type_bfile
        THEN
          RETURN '[BFILE_DATATYPE]';
        ELSIF p_column_values.data_type = apex_plugin_util.c_data_type_clob
        THEN
          RETURN p_column_values.value_list(p_row).clob_value;
        ELSE
          RETURN '[INVALID_DATATYPE]';
        END IF;

    END column_row_value; 
    
  BEGIN
    
    l_display_col_num := SUBSTR(l_dis_ret_cols, 1, INSTR(l_dis_ret_cols, ',') - 1);
    l_return_col_num := SUBSTR(l_dis_ret_cols, INSTR(l_dis_ret_cols, ',') + 1);
    l_hidden_cols := ',' || l_hidden_cols || ',';
    
    IF l_searchable_cols IS NOT NULL
        AND INSTR(',' || l_searchable_cols || ',', ',' || l_display_col_num || ',') = 0
    THEN 
        --User forgot to add display column as a searchable column, let's do it for them
        l_searchable_cols := l_display_col_num || ',' || l_searchable_cols;
    END IF;
    
    IF INSTR(l_hidden_cols, ',' || l_display_col_num || ',') > 0
    THEN
        --User mared display column as hidden, let's remove it for them
        l_hidden_cols := REPLACE(l_hidden_cols, ',' || l_display_col_num || ',', '');
    END IF;
    
    l_hidden_cols := TRIM(BOTH ',' FROM l_hidden_cols);
    l_hidden_cols := ',' || l_hidden_cols || ','; --Prep for repeated INSTRs later

    IF l_ajax_function = 'FETCH_LOV'
    THEN
        l_pagination_parts := apex_util.string_to_table(l_pagination);    

        IF l_search_string IS NOT NULL
        THEN
          IF l_searchable_cols IS NOT NULL 
              AND INSTR(',' || l_searchable_cols || ',', ',' || l_search_column_no || ',') = 0
          THEN
              RAISE_APPLICATION_ERROR(-20001, 'Super LOV Exception: Search attempt on non-searchable column.');
          END IF;
        
          l_search_string := apex_plugin_util.get_search_string(
              p_search_type   => l_search_type,
              p_search_string => l_search_string 
          );
        
          l_column_value_list := apex_plugin_util.get_data2(
              p_sql_statement    => l_lov_base_query, 
              p_min_columns      => 2, 
              p_max_columns      => 100, 
              p_component_name   => p_item.name,
              p_search_type      => l_search_type,
              p_search_column_no => l_search_column_no,
              p_search_string    => l_search_string,
              p_first_row        => l_pagination_parts(1),
              p_max_rows         => l_pagination_parts(2) + 1
          );
        ELSE
          l_column_value_list := apex_plugin_util.get_data2(
              p_sql_statement  => l_lov_base_query, 
              p_min_columns    => 2, 
              p_max_columns    => 100, 
              p_component_name => p_item.name,
              p_first_row      => l_pagination_parts(1),
              p_max_rows       => l_pagination_parts(2) + 1
          );   
        END IF;
        
        sys.htp.p('<table id="superlov-fetch-results" cellspacing="0" cellpadding="0" border="0" ' || 
          'data-fetch-lov-id="' || l_fetch_lov_id || '" class="superlov-table ui-widget ui-widget-content ui-corner-all">');
        sys.htp.p('<thead>');
        sys.htp.p('<tr>');
        

        FOR x IN 1 .. l_column_value_list.count
        LOOP
          IF INSTR(l_hidden_cols, ',' || x || ',') = 0
          THEN
              sys.htp.prn('<th class="ui-widget-header">');
              sys.htp.prn(l_column_value_list(x).name);
              sys.htp.prn('</th>');
          END IF;
        END LOOP;

        sys.htp.p('</tr>');
        sys.htp.p('</thead>');
        sys.htp.p('<tbody>');
        
        FOR x IN 1 .. LEAST(l_column_value_list(1).value_list.count, l_max_rows_per_page)
        LOOP 
          sys.htp.p(
              '<tr data-return="' || sys.htf.escape_sc(column_row_value(x, l_column_value_list(l_return_col_num))) 
              || '" data-display="' || sys.htf.escape_sc(column_row_value(x, l_column_value_list(l_display_col_num))) 
              || '"'
          );
          
          FOR y IN 1 .. l_column_value_list.count
          LOOP
              IF INSTR(l_hidden_cols, ',' || y || ',') > 0
              THEN
                sys.htp.prn(' data-col' || y || '-value="');
                sys.htp.prn(NVL(sys.htf.escape_sc(column_row_value(x, l_column_value_list(y))), l_show_null_as));
                sys.htp.prn('"');
              END IF;
          END LOOP;
          
          sys.htp.p('>');
          
          IF p_item.escape_output
          THEN
              FOR y IN 1 .. l_column_value_list.count
              LOOP
                IF INSTR(l_hidden_cols, ',' || y || ',') = 0
                THEN
                    sys.htp.prn('<td class="ui-state-default asl-col' || y || '">');
                    sys.htp.prn(NVL(sys.htf.escape_sc(column_row_value(x, l_column_value_list(y))), l_show_null_as));
                    sys.htp.prn('</td>');
                END IF;
              END LOOP;
          ELSE
              FOR y IN 1 .. l_column_value_list.count
              LOOP
                IF INSTR(l_hidden_cols, ',' || y || ',') = 0
                THEN
                    sys.htp.prn('<td class="ui-state-default asl-col' || y || '">');
                    sys.htp.prn(NVL(column_row_value(x, l_column_value_list(y)), l_show_null_as));
                    sys.htp.prn('</td>');
                END IF;
              END LOOP;
          END IF;
          
          sys.htp.p('</tr>');
        END LOOP;
        
        sys.htp.p('</tbody></table>');
        
        IF l_column_value_list(1).value_list.count > l_max_rows_per_page
        THEN
          sys.htp.p('<input id="asl-super-lov-more-rows" type="hidden" value="Y" />');
        ELSE
          sys.htp.p('<input id="asl-super-lov-more-rows" type="hidden" value="N" />');
        END IF;
    ELSIF l_ajax_function = 'GET_VALUES_BY_RETURN'
    THEN
        l_search_string := apex_plugin_util.get_search_string(
          p_search_type   => apex_plugin_util.c_search_lookup,
          p_search_string => l_return_val_search
        );
    
        l_column_value_list := apex_plugin_util.get_data2(
          p_sql_statement    => l_lov_base_query, 
          p_min_columns      => 2, 
          p_max_columns      => 100, 
          p_component_name   => p_item.name,
          p_search_type      => apex_plugin_util.c_search_lookup,
          p_search_column_no => l_return_col_num,
          p_search_string    => l_search_string
        );
        
        sys.htp.p('{');
        
        IF l_column_value_list(1).value_list.count = 0 
        THEN
          sys.htp.p('"matchFound": false');
        ELSIF l_column_value_list(1).value_list.count > 1 
        THEN
          sys.htp.p('"matchFound": false,');
          sys.htp.p('"error": "too many rows"');
        ELSE
          sys.htp.p('"matchFound": true,');
          sys.htp.p(   '"displayVal": "' || APEX_JAVASCRIPT.ESCAPE(column_row_value(1, l_column_value_list(l_display_col_num))) || '",');
          sys.htp.p(   '"returnVal": "' || APEX_JAVASCRIPT.ESCAPE(column_row_value(1, l_column_value_list(l_return_col_num))) || '"');
          
          l_map_from_parts := apex_util.string_to_table(l_map_from_cols, ',');
          l_map_to_parts := apex_util.string_to_table(l_map_to_items, ',');
          
          IF l_map_from_parts.COUNT > 0 THEN
              sys.htp.p(', "mappedColumns": [');
              FOR i IN 1 .. l_map_from_parts.COUNT
              LOOP
                IF i != 1 THEN
                    sys.htp.p(',');
                END IF;
                sys.htp.p('{');
                sys.htp.p(   '"mapItem": "' || APEX_JAVASCRIPT.ESCAPE(l_map_to_parts(i)) || '",');
                sys.htp.p(   '"mapVal": "' || APEX_JAVASCRIPT.ESCAPE(column_row_value(1, l_column_value_list(l_map_from_parts(i)))) || '"');
                sys.htp.p('}');
              END LOOP;
              sys.htp.p(']');
          END IF;
        END IF;
        
        sys.htp.p('}');
    END IF;
  END apex_super_lov_ajax;

  PROCEDURE apex_super_lov_validation (
      p_item   in            apex_plugin.t_item,
      p_plugin in            apex_plugin.t_plugin,
      p_param  in            apex_plugin.t_item_validation_param,
      p_result in out nocopy apex_plugin.t_item_validation_result 
  )

  IS

    lc_not_enterable          CONSTANT VARCHAR2(30) := 'NOT_ENTERABLE';
    lc_enterable_unrestricted CONSTANT VARCHAR2(30) := 'ENTERABLE_UNRESTRICTED';
    l_return_value            VARCHAR2(32767);
    l_validate_value          VARCHAR2(1) := NVL(p_item.attribute_01, 'Y');
    l_dis_ret_cols            VARCHAR2(10) := NVL(p_item.attribute_03, '2,1');
    l_enterable               VARCHAR2(30) := NVL(p_item.attribute_08, lc_not_enterable);
    l_return_col_num          PLS_INTEGER;

  BEGIN


    IF p_param.value IS NOT NULL
        AND l_enterable != lc_enterable_unrestricted
        AND l_validate_value = 'Y' 
    THEN
        l_return_col_num := SUBSTR(l_dis_ret_cols, INSTR(l_dis_ret_cols, ',') + 1);
    
        l_return_value := apex_plugin_util.get_display_data (
          p_sql_statement     => p_item.lov_definition,
          p_min_columns       => 1,
          p_max_columns       => 100,
          p_component_name    => p_item.name,
          p_display_column_no => l_return_col_num,
          p_search_column_no  => l_return_col_num,
          p_search_string     => p_param.value,
          p_display_extra     => FALSE --Can't trust this value
        );
        
        IF l_return_value IS NULL
        THEN
          p_result.message := '#LABEL# contains a value that was not in the list of values.';
        END IF;
    END IF;

  END apex_super_lov_validation;

END apex_super_lov_3_0;
/