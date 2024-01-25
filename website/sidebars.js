module.exports = {
    "docsSidebar": [
        {
            "type": "doc",
            "label": "Introduction",
            "id": "intro"
        },
        "what_is_new_v3",
        "migrating_from_v2",
        "customization_quickstart",
        "app_config",
        "deployment",
        "firebase_setup",
        {
            "type": "category",
            "label": "Collections",
            "collapsed": false,
            "items": [
                "collections/collections",
                "collections/callbacks",
                "collections/entity_actions",
                "collections/permissions",
                "collections/exporting_data",
                "collections/additional_columns",
                "collections/text_search",
                "collections/dynamic_collections",
                "collections/entity_views",
                "collections/collection_groups"
            ]
        },
        {
            "type": "category",
            "label": "Properties",
            "collapsed": true,
            "items": [
                "properties/properties_intro",
                {
                    "type": "category",
                    "label": "Fields",
                    "items": [
                        "properties/fields/text_fields",
                        "properties/fields/selects",
                        "properties/fields/file_upload",
                        "properties/fields/switch",
                        "properties/fields/date_time",
                        "properties/fields/references",
                        "properties/fields/group",
                        "properties/fields/key_value",
                        "properties/fields/repeat",
                        "properties/fields/block"
                    ]
                },
                {
                    "type": "category",
                    "label": "Config",
                    "items": [
                        "properties/config/properties_common",
                        "properties/config/string",
                        "properties/config/number",
                        "properties/config/boolean",
                        "properties/config/reference",
                        "properties/config/date",
                        "properties/config/array",
                        "properties/config/map",
                        "properties/config/geopoint"
                    ]
                },
                "properties/conditional_fields",
                "properties/custom_fields",
                "properties/custom_previews"
            ]
        },
        "top_level_views",
        {
            "type": "category",
            "label": "Provided hooks",
            "items": [
                "hooks/use_auth_controller",
                "hooks/use_side_entity_controller",
                "hooks/use_snackbar_controller",
                "hooks/use_reference_dialog",
                "hooks/use_firecms_context",
                "hooks/use_data_source",
                "hooks/use_storage_source",
                "hooks/use_mode_controller"
            ]
        },
        {
            "type": "category",
            "label": "Recipes",
            "collapsed": false,
            "items": [
                "recipes/building_a_blog",
                "recipes/copy_entity",
                "recipes/documents_as_subcollections"
            ]
        },
        "icons/icons",
        {
            "type": "category",
            "label": "Components",
            "collapsed": false,
            "items": [
                "components/components_intro",
                "components/alert",
                "components/avatar",
                "components/badge",
                "components/boolean_switch",
                "components/button",
                "components/card",
                "components/centered_view",
                "components/checkbox",
            ]
        },
        "changelog",
        // {
        //     "type":"category",
        //     "label":"API reference",
        //     "collapsed":true,
        //     "items":[
        //         {
        //             "type":"autogenerated",
        //             "dirName":"api"
        //         }
        //     ]
        // },

    ]
}

