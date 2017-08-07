CREATE OR REPLACE PACKAGE apex_super_lov_2_0
IS
/******************************************************************************   
<OVERVIEW>  
   This package is used by the SkillBuilders Super LOV plug-in. Learn more at
   http://skillbuilders.com/plugins   
</OVERVIEW>        
******************************************************************************/ 
--<GLOBAL_PUBLIC_DATA_STRUCTURES>  
--</GLOBAL_PUBLIC_DATA_STRUCTURES> 
 
--<GLOBAL_PUBLIC_CONSTANTS>  
--</GLOBAL_PUBLIC_CONSTANTS>  
  
--<GLOBAL_PUBLIC_VARIABLES>  
--</GLOBAL_PUBLIC_VARIABLES>  
  
--<GLOBAL_PUBLIC_EXCEPTIONS>  
--</GLOBAL_PUBLIC_EXCEPTIONS>  
/******************************************************************************
<OVERVIEW>
   This is the render function that adds the item to the page.
</OVERVIEW>   
******************************************************************************/
FUNCTION apex_super_lov_render (
   p_item                IN APEX_PLUGIN.T_PAGE_ITEM,
   p_plugin              IN APEX_PLUGIN.T_PLUGIN,
   p_value               IN VARCHAR2,
   p_is_readonly         IN BOOLEAN,
   p_is_printer_friendly IN BOOLEAN 
)

   RETURN APEX_PLUGIN.T_PAGE_ITEM_RENDER_RESULT;
/******************************************************************************
<OVERVIEW>
   This is the Ajax function that is used to build the LOV.
</OVERVIEW>   
******************************************************************************/
FUNCTION apex_super_lov_ajax (
   p_item   IN APEX_PLUGIN.T_PAGE_ITEM,
   p_plugin IN APEX_PLUGIN.T_PLUGIN
)

   RETURN APEX_PLUGIN.T_PAGE_ITEM_AJAX_RESULT;
/******************************************************************************
<OVERVIEW>
   This is the validation function that will recheck the submitted value against
   the LOV.
</OVERVIEW>   
******************************************************************************/
FUNCTION apex_super_lov_validation (
   p_item   IN APEX_PLUGIN.T_PAGE_ITEM,
   p_plugin IN APEX_PLUGIN.T_PLUGIN,
   p_value  IN VARCHAR2
)

   RETURN APEX_PLUGIN.T_PAGE_ITEM_VALIDATION_RESULT;
/*****************************************************************************/  
END apex_super_lov_2_0;
/