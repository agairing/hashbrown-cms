'use strict';

// Lib
window.markdownToHtml = require('marked');
window.htmlToMarkdown = require('to-markdown');

// Models
let Page = require('../../../server/models/Page');

// Views
let MessageModal = require('./MessageModal');

class PageEditor extends View {
    constructor(params) {
        super(params);

        this.$element = _.div({class: 'page-editor'});

        this.fetch();
    }

    /**
     * Event: Click reload. Fetches the model again
     */
    onClickReload() {
        this.model = null;

        this.fetch();
    }

    /**
     * Event: Click save. Posts the model to the modelUrl
     */
    onClickSave() {
        let view = this;

        view.$saveBtn.toggleClass('saving', true);

        $.ajax({
            type: 'post',
            url: view.modelUrl,
            data: view.model,
            success: function() {
                console.log('[PageEditor] Saved model to ' + view.modelUrl);
                view.$saveBtn.toggleClass('saving', false);
            },
            error: function(err) {
                new MessageModal({
                    model: {
                        title: 'Error',
                        body: err
                    }
                });
            }
        });
    }

    /**
     * Event: Click toggle publish
     */
    onClickTogglePublish() {

    }

    /**
     * Event: On click remove
     */
    onClickDelete() {
        new MessageModal({
            model: {
                title: 'Delete page',
                body: 'Are you sure you want to delete this page?'
            },
            buttons: [
                {
                    label: 'Cancel',
                    class: 'btn-default',
                    callback: function() {
                    }
                },
                {
                    label: 'OK',
                    class: 'btn-danger',
                    callback: function() {
                    }
                }
            ]
        });
    }

    /**
     * Binds event to fire when field editors are ready
     * Or fires them if no callback was passed
     *
     * @param {Function} callback
     */
    onFieldEditorsReady(callback) {
        if(!this.fieldEditorReadyCallbacks) {
            this.fieldEditorReadyCallbacks = [];
        }

        if(callback) {
            this.fieldEditorReadyCallbacks.push(callback);

        } else {
            for(let registeredCallback of this.fieldEditorReadyCallbacks) {
                registeredCallback();
            }

            this.fieldEditorReadyCallbacks = [];
        }
    }

    /**
     * Renders a field view
     *
     * @param {Object} field
     * @param {Object} schema
     * @param {Function} inputHandler
     *
     * @return {Object} element
     */
    renderFieldView(fieldValue, schemaValue, onChange) {
        let fieldSchema = resources.schemas[schemaValue.$ref];

        if(fieldSchema) {
            let fieldEditor = resources.editors[fieldSchema.id];
            
            if(fieldEditor) {
                let fieldEditorInstance = new fieldEditor({
                    value: fieldValue,
                    disabled: schemaValue.disabled,
                    onChange: onChange
                });

                return fieldEditorInstance.$element;

            } else {
                console.log('[PageEditor] No editor found for field schema id "' + fieldSchema.id + '"');
            
            }
        
        } else {
            console.log('[PageEditor] No field schema found for $ref "' + schemaValue.$ref + '"');

        }
    }

    /**
     * Renders an object
     *
     * @param {Object} data
     * @param {Object} schema
     *
     * @return {Object} element
     */
    renderObject(object, schema) {
        let view = this;

        return _.div({class: 'object'}, [
            _.ul({class: 'nav nav-tabs'}, 
                _.each(schema.tabs, function(id, tab) {
                    return _.li({class: id == schema.defaultTabId ? 'active' : ''}, 
                        _.a({'data-toggle': 'tab', href: '#tab-' + id},
                            tab
                        )
                    );
                })
            ),
            _.div({class: 'tab-content'},
                _.each(schema.tabs, function(id, tab) {
                    let properties = {};
                    
                    for(let alias in schema.properties) {
                        let property = schema.properties[alias];

                        let noTabAssigned = !property.tabId;
                        let isMetaTab = tab == 'Meta';
                        let thisTabAssigned = property.tabId == id;

                        if((noTabAssigned && isMetaTab) || thisTabAssigned) {
                            properties[alias] = property;
                        }
                    }

                    return _.div({id: 'tab-' + id, class: 'tab-pane' + (id == schema.defaultTabId ? ' active' : '')}, 
                        _.each(properties, function(key, value) {
                            return _.div({class: 'field-container'}, [
                                _.div({class: 'field-icon'},
                                    _.span({class: 'fa fa-' + value.icon})
                                ),
                                _.div({class: 'field-key'},
                                    value.label || key
                                ),
                                _.div({class: 'field-value'},
                                    view.renderFieldView(
                                        object[key],
                                        schema.properties[key],
                                        function(newValue) {
                                            object[key] = newValue;
                                        }
                                    )
                                )
                            ]);
                        })
                    );
                })
            )
        ]);
    }

    /**
     * Gets a schema with $parent included recursively
     *
     * @param {Number} id
     *
     * @return {Object} schema
     */
    getSchemaWithParents(id) {
        let schema = $.extend(true, {}, resources.schemas[id]);

        if(schema) {
            // Merge parent with current schema
            // Since the child schema should override any duplicate content, the parent is transformed first, then returned as the resulting schema
            if(schema.$parent) {
                let parentSchema = this.getSchemaWithParents(schema.$parent);

                for(let k in schema.properties) {
                   parentSchema.properties[k] = schema.properties[k];
                }
                
                for(let k in schema.tabs) {
                   parentSchema.tabs[k] = schema.tabs[k];
                }

                parentSchema.defaultTabId = schema.defaultTabId;
                parentSchema.icon = schema.icon;

                schema = parentSchema;
            }

        } else {
            console.log('No schema with id "' + id + '" available in resources');
        
        }

        return schema;
    }


    render() {
        let view = this;

        let page = new Page(this.model);
        let pageSchema = this.getSchemaWithParents(this.model.schemaId);

        if(pageSchema) {
            this.$element.html([
                this.renderObject(this.model, pageSchema).append(
                    _.div({class: 'panel panel-default panel-buttons'}, 
                        _.div({class: 'btn-group'}, [
                            _.button({class: 'btn btn-danger'},
                                _.span({class: 'fa fa-trash'})
                            ).click(function() { view.onClickDelete(); }),
                            _.button({class: 'btn btn-primary'},
                                _.span({class: 'fa fa-refresh'})
                            ).click(function() { view.onClickReload(); }),
                            _.button({class: 'btn btn-primary'}, [
                                (page.isPublished() ? 'Unpublish' : 'Publish') + ' ',
                                _.span({class: 'fa fa-newspaper-o'})
                            ]).click(function() { view.onClickTogglePublish(); }),
                            view.$saveBtn = _.button({class: 'btn btn-primary btn-save'}, [
                                _.span({class: 'text-default'}, 'Save '),
                                _.span({class: 'icon-default fa fa-save'}),
                                _.span({class: 'text-saving'}, 'Saving '),
                                _.span({class: 'icon-saving fa fa-refresh'})
                            ]).click(function() { view.onClickSave(); })
                        ])
                    )
                )
            ]);

            this.onFieldEditorsReady();
        }
    }
}

module.exports = PageEditor;