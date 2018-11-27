CREATE OR REPLACE PACKAGE apex_super_lov_3_0
IS

  PROCEDURE apex_super_lov_render (

    p_item   in            apex_plugin.t_item,
    p_plugin in            apex_plugin.t_plugin,
    p_param  in            apex_plugin.t_item_render_param,
    p_result in out nocopy apex_plugin.t_item_render_result   
  );

  PROCEDURE apex_super_lov_ajax (
      p_item   in            apex_plugin.t_item,
      p_plugin in            apex_plugin.t_plugin,
      p_param  in            apex_plugin.t_item_ajax_param,
      p_result in out nocopy apex_plugin.t_item_ajax_result
  );

  PROCEDURE apex_super_lov_validation (
      p_item   in            apex_plugin.t_item,
      p_plugin in            apex_plugin.t_plugin,
      p_param  in            apex_plugin.t_item_validation_param,
      p_result in out nocopy apex_plugin.t_item_validation_result 
  );

END apex_super_lov_3_0;
/