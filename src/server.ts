import express from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles, validExtension} from './util/util';
import validUrl from 'valid-url';
import { findEdges } from './util/child-process';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;

  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // endpoint to get the image, process it and return the filtered image
  app.get("/filteredimage/", async (req, res) => {
    try {
      let { image_url } = req.query;
      let { lower } = req.query;
      let { upper } = req.query;

      // Check if the user has entered any query parameter
      if (!image_url) {
        return res.status(422)
          .send({error: 'Please Enter a URL'});
      }

      // If we have a query parameter, check if it is a valid url
      if(!validUrl.isUri(image_url)){
        return res.status(415).send({error: 'Please provide a valid url'});
      }

      // Process the image
      let imgPath = await filterImageFromURL(image_url);
      if(imgPath) {
        const newPath = await findEdges(imgPath, lower, upper);
        res.on('finish', () => deleteLocalFiles([imgPath, newPath.trim()]));
        return res.status(200).sendFile(newPath.trim());
      } else {
        return res.status(500).send({error: 'We can not elaborate your image'});
      }
    } catch {
      return res.status(500).send({error: 'We can not process your request'})
    }
  });


  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.status(200).send({
        "message": "Access the /filteredimage route to get a filtered image",
        "route": "/filteredimage",
        "parameters": {
          "parameter1": "The URL of the Image(required)",
          "parameter2": "lower (optional - lower Canny threshold. upper required)",
          "parameter3": "upper (optional - upper Canny threshold. lower required)"
        },
        "example": "https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/close-up-of-tulips-blooming-in-field-royalty-free-image-1584131616.jpg?crop=0.630xw:1.00xh;0.186xw,0&resize=640:*"
      })
  } );


  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();
