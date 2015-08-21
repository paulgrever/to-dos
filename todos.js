Todos = new Meteor.Collection('todos');
Lists = new Meteor.Collection('lists');

Router.route('/register');
Router.route('/login');
Router.route('/list/:_id', {
    name: 'listPage',
    template: 'listPage',
    data: function(){
        var currentList = this.params._id;
        var currentUser = Meteor.userId();
        return Lists.findOne({ _id: currentList, createdBy: currentUser });
    },
    onRun: function(){
        console.log("You triggered 'onRun' for 'listPage' route.");
        this.next();
    },
    onRerun: function(){
        console.log("You triggered 'onRerun' for 'listPage' route.");
    },
    onBeforeAction: function(){
        console.log("You triggered 'onBeforeAction' for 'listPage' route.");
        var currentUser = Meteor.userId();
        if(currentUser){
            this.next();
        } else {
            this.render("login");
        }
    },
    onAfterAction: function(){
        console.log("You triggered 'onAfterAction' for 'listPage' route.");
    },
    onStop: function(){
        console.log("You triggered 'onStop' for 'listPage' route.");
    }
});
Router.route('/', {
  name : 'home',
  template: 'home'
});
Router.configure({
    layoutTemplate: 'main'
});

if(Meteor.isClient){
    // client code goes here
  Template.todos.helpers({
    'todo' : function(){
      var currentList = this._id;
      var currentUser = Meteor.userId();
      return Todos.find({ listId: currentList, createdBy: currentUser }, {sort: {createdAt: -1}})
    }
  });

  Template.todoItem.helpers({
    "checked" : function(){
      var isCompleted = this.completed;
      if(isCompleted){
        return "checked";
      } else {
        return ""
      }
    }
  });

  Template.todosCount.helpers({
    'totalTodos' : function(){
      var currentList = this._id;
      return Todos.find({listId: currentList}).count();
    },
    'completedTodos' : function(){
      var currentList = this._id;
      return Todos.find({completed: true, listId : currentList}).count();
    }
  });

  Template.lists.helpers({
    'list' : function(){
      var currentUser = Meteor.userId();
      return Lists.find({createdBy : currentUser}, {sort: {name: 1}});
    }
  });

  Template.addList.events({
    'submit form': function(event){
      event.preventDefault();
      var listName = $('[name=listName]').val();
      var currentUser = Meteor.userId();
      Lists.insert({
          name: listName,
          createdBy: currentUser
      }, function(error, results){
        Router.go('listPage', {_id: results});

      });
      $('[name=listName]').val('');
    }
});

  Template.addTodo.events({
    'submit form' : function(event){
      event.preventDefault();
      var todoName = $('[name="todoName"]').val();
      var currentList = this._id;
      var currentUser = Meteor.userId();
      Todos.insert({
        name : todoName,
        completed : false, 
        createdAt : new Date(),
        listId : currentList,
        createdBy : currentUser
      });
      $('[name="todoName').val('');
    }
  });

  Template.login.events({
    'submit form' : function(event){
      event.preventDefault();
      // var email = $('[name=email]').val();
      // var password = $('[name=password]').val();
      // Meteor.loginWithPassword(email, password, function(error){
      //   if(error){
      //     console.log(error.reason);
      //   } else {
      //     var currentRoute = Router.current().route.getName();
      //     if (currentRoute == "login") {
      //      Router.go("home");
      //    } 
      //   }
      // });
      // $('[name=email]').val("");
      // $('[name=password]').val("");
    }
  });

Template.login.onRendered(function(){
    var validator = $('.login').validate({
      submitHandler : function(event){
        var email = $('[name=email]').val();
        var password = $('[name=password]').val();
        Meteor.loginWithPassword(email, password, function(error){
        if(error){
          if(error.reason == "User not found"){
              validator.showErrors({
                  email: error.reason    
              });
          }
          if(error.reason == "Incorrect password"){
              validator.showErrors({
                  password: error.reason    
              });
          }
        } else {
            var currentRoute = Router.current().route.getName();
            if(currentRoute == "login"){
                Router.go("home");
            }
          }
      });
      }
    });
});

  Template.login.onDestroyed(function(){
      console.log("The 'login' template was just destroyed.");
  });

  Template.navigation.events({
    'click .logout' : function(){
      event.preventDefault();
      Meteor.logout();
      Router.go('login');
    }
  });

  Template.register.events({
    "submit form" : function(event){
      event.preventDefault();
      // var email = $('[name=email]').val();
      // var password = $('[name=password]').val();
      // Accounts.createUser({
      //   email : email,
      //   password : password
      // }, function(error){
      //   if(error){
      //     console.log(error.reason);
      //   } else {
      //     Router.go("home")
      //   }
      // });
    }
  });

  $.validator.setDefaults({
    rules: {
        email: {
            required: true,
            email: true
        },
        password: {
            required: true,
            minlength: 6
        }
    },
    messages: {
        email: {
            required: "You must enter an email address.",
            email: "You've entered an invalid email address."
        },
        password: {
            required: "You must enter a password.",
            minlength: "Your password must be at least {0} characters."
        }
    }
});

Template.register.onRendered(function(){
    $('.register').validate({
        submitHandler: function(event){
            var email = $('[name=email]').val();
            var password = $('[name=password]').val();
            Accounts.createUser({
                email: email,
                password: password
            }, function(error){
                if(error){
                  if(error.reason == "Email already exists."){
                      validator.showErrors({
                          email: "That email already belongs to a registered user."   
                      });
                  }
              } else {
                    Router.go("home");
                }
            });
        }    
    });
});

  Template.todoItem.events({
    'click .delete-todo' : function(event){
      event.preventDefault();
      var documentId = this._id;
      var confirm = window.confirm("Delete this task?")
      if (confirm) {
        Todos.remove({_id: documentId});
      }    
    }, 
    'keypress [name=todoItem]' : function(event){
      if(event.which == 13 || event.which == 27){
        $(event.target).blur();
      } else {
        var documentId = this._id;
        var todoItem = $(event.target).val();
        Todos.update({ _id: documentId }, {$set: { name: todoItem }});
      }
    },
    'change [type=checkbox]' : function(){
      var documentId = this._id;
      var isCompleted = this.completed;
      if(isCompleted){
        Todos.update({ _id: documentId }, {$set: { completed: false }});
      } else {
        Todos.update({ _id: documentId }, {$set: { completed: true }});
      }
    }
  });
}

if(Meteor.isServer){
    // server code goes here
}
