require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT;
const URI = process.env.MONGOSTRING;
const PASSWORD = process.env.PASSWORD;
const mongoose = require("mongoose");
const Post = require("./models/ads");
const bodyParser = require("body-parser");
const fs = require("fs");
const util = require("util");
const readAsync = util.promisify(fs.readFile);
const writeAsync = util.promisify(fs.writeFile);
const path = require("path");
const requestPath = "requests.json";
const userPath = "users.json";
const args = process.argv;

const read = async (path) => {
  const file = await readAsync(path, { encoding: "utf-8" });
  return file;
};

const write = async (path, data) => {
  const file = await writeAsync(path, data);
  return file;
};

const loggerMiddleware = async (req, res, next) => {
  try {
    const file = await read(requestPath);
    const fl = await JSON.parse(file);
    const request = {
      method: req.method,
      timestamp: new Date().toLocaleString(),
      url: req.url,
    };
    fl.push(request);
    await write(requestPath, JSON.stringify(fl));
  } catch (err) {
    console.log(err.message);
  }
  next();
};

if (args[2] === "debug") app.use(loggerMiddleware);

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((_) => {
    app.listen(port, () => {
      console.log(`App running at port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err.message);
  });

const checkUserMiddleware = async (req, res, next) => {
  const id = req.params.id;
  const token = req.headers["authorization"];
  if (!token) res.status(401).send("Bad token");
  const [email, password] = token.split("&");
  let fl;
  let truth;
  let index;
  try {
    const file = await read(userPath);
    fl = JSON.parse(file);
  } catch (err) {
    res.status(500).send("Something wrong");
  }
  for (let i = 0; i < fl.length; i++) {
    if (fl[i].posts.includes(id)) {
      truth = true;
      index = i;
    }
  }
  if (truth) {
    if (fl[index].email === email && fl[index].password === password) {
      fl[index].posts = fl[index].posts.filter((e) => e !== id);
      await write(userPath, JSON.stringify(fl));
      next();
    } else {
      res.status(401).send("No chance");
    }
  } else {
    if (token !== PASSWORD) res.status(401).send("Bad token");
    next();
  }
};

const checkAuthorizationMiddleware = async (req, res, next) => {
  const post = new Post(JSON.parse(JSON.stringify(req.body)));
  req.post = post;
  const token = req.headers["authorization"];
  if (!token) next();
  const [email, password] = token.split("&");
  try {
    const file = await read(userPath);
    const fl = JSON.parse(file);
    const user = fl.findIndex(
      (e) => e.email === email && e.password === password
    );
    if (!user) next();
    fl[user].posts.push(post.id);
    await write(userPath, JSON.stringify(fl));
    next();
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Something wrong");
  }
};

app.get("/heartbeat", (req, res) => {
  res.status(200).send(new Date().toLocaleString());
});

app.post("/add", checkAuthorizationMiddleware, (req, res) => {
  req.post
    .save()
    .then((_) => {
      res.status(200).send("Done!");
    })
    .catch((err) => {
      console.log(err.message);
      res.status(500).send("Something wrong");
    });
});

app.get("/posts", (req, res) => {
  Post.find()
    .then((result) => {
      res.status(200).send(result);
    })
    .catch((err) => {
      console.log(err.message);
      res.status(404).send("There is no posts to display");
    });
});

app.get("/post/category/:category", (req, res) => {
  const category = req.params.category;
  console.log(req.params);
  Post.find({ category: category }, (err, result) => {
    if (err) {
      console.log(err.message);
      res.send("Not found");
    } else if (result.length === 0) {
      res.send("Not found");
    } else {
      res.send(result);
    }
  });
});

app.get("/post/author/:author", (req, res) => {
  const author = req.params.author;
  console.log(author);
  Post.find({ author: author }, (err, result) => {
    if (err) {
      console.log(err.message);
      res.send("Not found");
    } else if (result.length === 0) {
      res.send("Not found");
    } else {
      res.send(result);
    }
  });
});

app.get("/post/price/:min/:max", (req, res) => {
  const min = req.params.min;
  const max = req.params.max;
  Post.find({}, (err, result) => {
    if (err) {
      console.log(err.message);
      res.send("Not found");
    } else if (result.length === 0) {
      res.send("Not found");
    } else {
      const posts = result.filter(
        (post) => post.price >= min && post.price <= max
      );
      res.send(posts);
    }
  });
});

app.get("/post/title/:title", (req, res) => {
  const title = req.params.title;

  Post.find({ title: title }, (err, result) => {
    if (err) {
      console.log(err.message);
      res.send("Not found");
    } else if (result.length === 0) {
      res.send("Not found");
    } else {
      res.send(result);
    }
  });
});

app.get("/post/:id", (req, res) => {
  const id = req.params.id;
  Post.findById(id)
    .then((result) => {
      res.status(200).send(result);
    })
    .catch((err) => {
      console.log(err.message);
      res.status(404).send("Post not found");
    });
});

app.delete("/post/:id", checkUserMiddleware, (req, res) => {
  const id = req.params.id;
  Post.findByIdAndDelete(id)
    .then((_) => {
      res.status(204).send("Post deleted");
    })
    .catch((err) => {
      console.log(err.message);
      res.status(404).send("Post not found");
    });
});

app.use("*", express.static(path.join(__dirname, "images/image.jpg")));

// const checkUserMiddleware = async (req, res, next) => {
//   const id = req.params.id;
//   const token = req.headers['authorization'];
//   // if(!token || token !== password) {
//   //   res.status(401);
//   //   res.send("bad token");
//   // }
//   if(token === password) {
//     try{
//     const file = await read('users.json');
//     let fl = JSON.parse(file);
//     // const user = fl.findIndex(e => e.email === email && e.password === password);
//     // const available = fl.filter((e, i) => e.posts[i] === id);
//     // if(available) {
//       res.status(401);
//       res.send("You are not authorized to delete this post");
//     // }
//   }catch(err) {
//     res.status(500).send('Something wrong')
//   }
//   };
//   if(token.includes('&')) {
//     try{
//     const [email, password] = token.split('&');
//     const user = fl.findIndex(e => e.email === email && e.password === password );
//     if(!user && user != 0) {
//       console.log(user)
//       res.status(401);
//       res.send("bad token");
//     }
//     if(!user.posts.includes(id)){
//       res.status(401);
//       res.send("You can delete or modify only posts added by urself");
//     }
//     // fl[user].posts = fl[user].posts.filter(e => e !== id);
//     // await write('users.json', JSON.stringify(fl));
//     next();
//   }catch(err) {
//     res.status(500).send('Something wrong')
//   }
//   }
// }
