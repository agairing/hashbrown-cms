'use strict';

/**
 * @namespace HashBrown.Server.Models
 */
namespace('Models')
.add(require('./Connection'))
.add(require('./Content'))
.add(require('./ContentSchema'))
.add(require('Common/Models/Deployer'))
.add(require('Common/Models/Entity'))
.add(require('./FieldSchema'))
.add(require('Common/Models/Form'))
.add(require('./Media'))
.add(require('Common/Models/Processor'))
.add(require('Common/Models/Project'))
.add(require('Common/Models/Resource'))
.add(require('Common/Models/Schema'))
.add(require('./Task'))
.add(require('./User'));
