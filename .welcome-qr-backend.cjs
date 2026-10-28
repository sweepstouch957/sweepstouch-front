const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../backend/services/qr-service/src');
const model = `import mongoose from "mongoose";
import { QrImageSchema } from "./qrImage.schema.js";

const schema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, unique: true },
  slug: { type: String, required: true, index: true },
  link: { type: String, required: true },
  qr: { type: QrImageSchema, required: true },
}, { timestamps: true });

export default mongoose.model("StoreWelcomeQr", schema);
`;
const routes = `import { Router } from "express";
import mongoose from "mongoose";
import { getModels } from "@sweepstouch/mongoose-kit";
import StoreWelcomeQr from "../models/storeWelcomeQr.model.js";
import { createQrForUrl } from "../services/qrClient.js";

const router = Router();

router.get("/store/:storeId/welcome", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.storeId)) {
      return res.status(400).json({ success: false, message: "Invalid store ID" });
    }
    const doc = await StoreWelcomeQr.findOne({ store: req.params.storeId }).lean();
    return res.json({ success: true, data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/stores/:storeId/welcome", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.storeId)) {
      return res.status(400).json({ success: false, message: "Invalid store ID" });
    }
    const { Store } = getModels(req);
    const store = await Store.findById(req.params.storeId).select("slug").lean();
    if (!store) return res.status(404).json({ success: false, message: "Store not found" });
    if (!store.slug) return res.status(400).json({ success: false, message: "Store slug is required" });

    const link = new URL("https://st.sweepstouch.com/w");
    link.searchParams.set("slug", store.slug);
    const folder = \`qr-codes/stores/\${store.slug}/welcome\`;
    const image = await createQrForUrl(link.href, { folder });
    const doc = await StoreWelcomeQr.findOneAndUpdate(
      { store: store._id },
      { store: store._id, slug: store.slug, link: link.href, qr: {
        secureUrl: image.secureUrl,
        publicId: image.publicId,
        folder,
        size: image.meta.size,
        format: image.meta.format,
        level: image.meta.level,
        generatedAt: image.meta.generatedAt,
      } },
      { new: true, upsert: true, runValidators: true }
    );
    return res.json({ success: true, data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
`;
const routePath = path.join(root, 'routes/qr.routes.js');
let existing = fs.readFileSync(routePath, 'utf8');
if (existing.includes('welcomeQrRouter')) throw new Error('Welcome QR routes already exist');
for (const name of ['models/storeWelcomeQr.model.js', 'routes/welcomeQr.routes.js']) {
  if (fs.existsSync(path.join(root, name))) throw new Error(`Refusing to overwrite ${name}`);
}
existing = 'import welcomeQrRouter from "./welcomeQr.routes.js";\n' + existing;
existing = existing.replace('const router = Router();', 'const router = Router();\nrouter.use(welcomeQrRouter);');
fs.writeFileSync(path.join(root, 'models/storeWelcomeQr.model.js'), model);
fs.writeFileSync(path.join(root, 'routes/welcomeQr.routes.js'), routes);
fs.writeFileSync(routePath, existing);
console.log('Added independent persistent welcome QR model and routes.');
