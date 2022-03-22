const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fs = require('fs')
const app = express();
const path = require('path')
const Posts = require('./Posts.js')
const fileupload = require('express-fileupload')
var session = require('express-session');

mongoose.connect('mongodb+srv://root:Martinez@cluster0.umvhs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{useNewUrlParser: true, useUnifiedTopology:true}).then(function(){
    console.log('Conectado com sucesso ao mongodb')
}).catch(function(err){
    console.log(err.message);
})

app.engine('html', require('ejs').renderFile);
app.set('view engine','html');
app.use('/public',express.static(path.join(__dirname, 'public')));
app.set('views' , path.join(__dirname,'/pages'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(fileupload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'temp')
}))

app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))

app.get('/',(req,res) => {
   // console.log(req.query);

    if(req.query.busca == null){
        Posts.find({}).sort({'_id': -1}).exec(function(err,posts){
           posts = posts.map(function(val){
               return{
               titulo: val.titulo,
               conteudo: val.conteudo,
               descricao: val.conteudo.substr(0,190).concat('...'),
               descricaoCurta: val.conteudo.substr(0,80).concat('...'),
               imagem: val.imagem,
               slug: val.slug,
               categoria: val.categoria,
               views: val.views
               }
           })
           Posts.find({}).sort({'views': -1}).limit(4).exec(function(err,postsTop){


             postsTop = postsTop.map(function(val){

                     return {

                         titulo: val.titulo,
                         conteudo: val.conteudo,
                         descricao: val.conteudo.substr(0,190).concat('...'),
                         descricaoCurta: val.conteudo.substr(0,80).concat('...'),
                         imagem: val.imagem,
                         slug: val.slug,
                         categoria: val.categoria,
                         views: val.views

                     }

             })
             res.render('home',{posts:posts,postsTop:postsTop});
         })
        })

    }else{
        Posts.find({titulo:{$regex: req.query.busca,$options:"i"}},function(err,posts){
            posts = posts.map(function(val){

                return {

                    titulo: val.titulo,
                    conteudo: val.conteudo,
                    descricao: val.conteudo.substr(0,190).concat('...'),
                    descricaoCurta: val.conteudo.substr(0,80).concat('...'),
                    imagem: val.imagem,
                    slug: val.slug,
                    categoria: val.categoria,
                    views: val.views

                }

        })
            res.render('busca',{posts:posts,contagem:posts.length});
        })

    }

})

app.get('/:slug',(req,res)=>{
    Posts.findOneAndUpdate({slug:req.params.slug}, {$inc:{views:1}}, {new: true}, function(err,resposta){
        //console.log(resposta);
       if(resposta != null){
        Posts.find({}).sort({'views': -1}).limit(4).exec(function(err,postsTop){

            // console.log(posts[0]);

             postsTop = postsTop.map(function(val){

                     return {

                         titulo: val.titulo,

                         conteudo: val.conteudo,

                         descricao: val.conteudo.substr(0,190).concat('...'),

                         descricaoCurta: val.conteudo.substr(0,80).concat('...'),

                         imagem: val.imagem,

                         slug: val.slug,

                         categoria: val.categoria,

                         views: val.views

                         

                     }
                     

             })
             mensagemCadastro = ''
             res.render('single',{noticia:resposta,postsTop:postsTop});

         })
         let cat = req.url;
         if(cat.indexOf('?busca=') > -1){
            console.log(req.query.busca);
            console.log(cat)
            //console.log((`http://localhost:3000/?busca=`+req.query.busca));
            res.redirect(`https://easynews-app.herokuapp.com/?busca=`+req.query.busca);
            // trocar para o link do heroku
         }
         
       }else{
        mensagemCadastro = ''
           res.redirect('/');
       }

    })
})
// lembra de fazer os inputs password terem a opção de ficarem visiveis;
var usuarios = [
    {
        login: 'matheus',
        senha: '123'
    },
]
var mensagem = '';
var mensagemCadastro = '';
var mesage = '';

app.post('/admin/login',(req,res)=>{
    usuarios.map(function(val){
        if(val.login == req.body.login && val.senha == req.body.senha){
            mensagem = '';
            req.session.login = req.body.login;
        }else{
             mensagem = 'Usuario invalido';
        }
    })
    res.redirect('/admin/login');
})
app.post('/admin/cadastro',(req,res)=>{
    //console.log(req.body);
    
   let formato = req.files.arquivo.name.split('.');
   let formato1 = req.files.arquivo1.name.split('.'); 
   var imagem1 = '';
    var imagem = '';
    if(formato[formato.length - 1] == 'jpg' || formato[formato.length - 1] == 'png'){
        imagem = new Date().getTime()+formato[formato.length - 1];
      req.files.arquivo.mv(__dirname+'/public/imagens/'+imagem)
     }else{
         fs.unlinkSync(req.files.arquivo.tempFilePath);
     }

   if(formato1[formato1.length - 1] == 'jpg' || formato1[formato1.length - 1] == 'png'|| formato1[formato1.length - 1] == 'JPEG'
   || formato1[formato1.length - 1] == 'jpeg'
   ){
    imagem1 = new Date().getTime()+formato1[formato1.length - 1];
    req.files.arquivo1.mv(__dirname+'/public/imagens/'+imagem1)
   }else{
       fs.unlinkSync(req.files.arquivo1.tempFilePath);
   }

   var categoriaUperr = req.body.categoria.toUpperCase()
   var noticia = `<p>${req.body.noticia}</p> `+` <p>${req.body.noticia1}</p>`

    Posts.create({
        titulo: req.body.titulo_noticia,
        imagem: 'https://easynews-app.herokuapp.com/public/imagens/'+imagem,// trocar para o link do heroku
        categoria: categoriaUperr,
        conteudo: noticia,
        slug: req.body.slug,
        autor: req.body.autor,
        imgAutor: 'https://easynews-app.herokuapp.com/public/imagens/'+imagem1,// trocar para o link do heroku
        views: 0,
    })

        mensagemCadastro = 'Noticia Cadastrada com sucesso!'
    
    res.redirect('/admin/login');
})

app.get('/admin/deletar/:id',(req,res)=>{
        mensagemCadastro = 'Noticia Excluida com sucesso!';
    Posts.deleteOne({_id:req.params.id}).then(function(){
    })
    res.redirect('/admin/login');
})

app.get('/admin/cadastrar',(req,res)=>{
    mensagemCadastro = ''
    res.render('admin-cadastrar',{men2:mesage})
})
app.post('/admin/cadastrar',(req,res)=>{
    usuarios.push({login: req.body.nome,senha:req.body.password})
   console.log(usuarios.push({login: req.body.nome,senha:req.body.password}))
    console.log(req.body);
    mesage = 'Usuario Cadastrado com Sucesso';
    res.redirect('/admin/cadastrar');
})
app.get('/admin/login',(req,res)=>{
    if(req.session.login == null){
        res.render('admin-login',{men: mensagem}); 
    }else{
        Posts.find({}).sort({'views': -1}).exec(function(err,posts){


            posts = posts.map(function(val){

                    return {
                        id: val._id,
                        titulo: val.titulo,
                        tituloCurto: val.titulo.substr(0,50).concat('...'),
                        conteudo: val.conteudo,
                        descricao: val.conteudo.substr(0,190).concat('...'),
                        descricaoCurta: val.conteudo.substr(0,80).concat('...'),
                        imagem: val.imagem,
                        slug: val.slug,
                        categoria: val.categoria,
                        views: val.views

                    }

            })
            res.render('admin-panel',{posts:posts,men1: mensagemCadastro});
    
    })
    let cat = req.url;
    if(cat.indexOf('?busca=') > -1){
       console.log(req.query.busca);
       console.log(cat)
       //console.log((`http://localhost:3000/?busca=`+req.query.busca));
       res.redirect(`https://easynews-app.herokuapp.com/?busca=`+req.query.busca);
       // trocar para o link do heroku
    }
}

})

app.listen(3000,()=>{
    console.log('server rodando!');
})