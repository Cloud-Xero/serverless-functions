## Quickstarts

---

### Quickstart: Hello, World on your local machine

1. Create an index.js file with the following contents:
   ```
    exports.helloWorld = (req, res) => {
      res.send('Hello, World');
    };
   ```
2. Run the following command:
   ```
   npx @google-cloud/functions-framework --target=helloWorld
   ```
3. Open http://localhost:8080/ in your browser and see Hello, World.
