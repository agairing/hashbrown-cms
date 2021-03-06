'use strict';

/**
 * The project backup editor
 *
 * @memberof HashBrown.Client.Views.Dashboard
 */
class BackupEditor extends HashBrown.Views.Modals.Modal {
    /**
     * Event: Click upload button
     */
    onClickUploadBackup() {
        let uploadModal = new HashBrown.Views.Modals.Modal({
            title: 'Upload a backup file',
            body: new HashBrown.Views.Widgets.Input({
                type: 'file',
                name: 'backup',
                onSubmit: (formData) => {
                    let apiPath = 'server/backups/' + this.model.id + '/upload';

                    // TODO: Use the HashBrown.Helpers.RequestHelper for this
                    $.ajax({
                        url: HashBrown.Helpers.RequestHelper.environmentUrl(apiPath),
                        type: 'POST',
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: (id) => {
                            this.model = null;
                            this.fetch();

                            uploadModal.close();
                        }
                    });
                }
            }).$element,
            actions: [
                {
                    label: 'OK',
                    onClick: () => {
                        uploadModal.$element.find('form').submit();
                        
                        return false;
                    }
                }
            ]
        });
    }

    /**
     * Event: Click backup button
     */
    onClickCreateBackup() {
        if(!currentUserIsAdmin()) { return; }

        HashBrown.Helpers.RequestHelper.request('post', 'server/backups/' + this.model.id + '/new')
        .then((data) => {
            this.model = null;
            this.fetch();
        })
        .catch(UI.errorModal);
    }

    /**
     * Event: Click restore backup button
     *
     * @param {String} timestamp
     */
    onClickRestoreBackup(timestamp) {
        if(!currentUserIsAdmin()) { return; }
            
        let label = '"' + timestamp + '"';
        let date = new Date(parseInt(timestamp));

        if(!isNaN(date.getTime())) {
            label = date.toString();
        }
                            
        let modal = UI.confirmModal('restore', 'Restore backup', 'Are you sure you want to restore the backup ' + label + '? Current content will be replaced.', () => {
            HashBrown.Helpers.RequestHelper.request('post', 'server/backups/' + this.model.id + '/' + timestamp + '/restore')
            .then(() => {
                modal.close();
                
                this.trigger('change');

                this.close();
            })
            .catch(UI.errorModal);
        });
    }
    
    /**
     * Event: Click delete backup button
     */ 
    onClickDeleteBackup(timestamp) {
        if(!currentUserIsAdmin()) { return; }
        
        let label = timestamp;
        let date = new Date(parseInt(timestamp));

        if(!isNaN(date.getTime())) {
            label = date.toString();
        }
        
        let modal = UI.confirmModal('delete', 'Delete backup', 'Are you sure you want to delete the backup "' + label + '"?', () => {
            HashBrown.Helpers.RequestHelper.request('delete', 'server/backups/' + this.model.id + '/' + timestamp)
            .then(() => {
                modal.close();

                this.model = null;
                this.fetch();
            })
            .catch(UI.errorModal);
        });
    }

    /**
     * Pre render
     */
    prerender() {
        if(this.model instanceof HashBrown.Models.Project === false) {
            this.model = new HashBrown.Models.Project(this.model);
        }
        
        this.title = this.model.settings.info.name + ' backups';
        this.body = _.div(
            _.if(!this.model.backups || this.model.backups.length < 1,
                _.label({class: 'widget widget--label'}, 'No backups yet')
            ),
            // List existing backups
            _.each(this.model.backups, (i, backup) => {
                let label = backup;
                let date = new Date(parseInt(backup));

                if(!isNaN(date.getTime())) {
                    label = date.toString();
                }

                return _.div({class: 'page--dashboard__backup-editor__backup widget-group'},
                    _.p({class: 'widget widget--label page--dashboard__backup-editor__back__label'}, label),
                    new HashBrown.Views.Widgets.Dropdown({
                        icon: 'ellipsis-v',
                        reverseKeys: true,
                        options: {
                            'Restore': () => { this.onClickRestoreBackup(backup); },
                            'Download': () => { location = HashBrown.Helpers.RequestHelper.environmentUrl('server/backups/' + this.model.id + '/' + backup + '.hba') },
                            'Delete': () => { this.onClickDeleteBackup(backup); }
                        }
                    }).$element
                );
            })
        );

    }

    /**
     * Renders the modal footer
     *
     * @returns {HTMLElement} Footer
     */
    renderFooter() {
        return [    
            _.button({class: 'widget widget--button', title: 'Upload backup'}, 'Upload')
                .click(() => { this.onClickUploadBackup(); }),
            _.button({class: 'widget widget--button', title: 'Create a new backup'}, 'Create')
                .click(() => { this.onClickCreateBackup(); })
        ];
    }
}

module.exports = BackupEditor;
