import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const productSuffixToImage = {
  "ec9bb8": "/products/zinc_fasteners_ec9bb8.png",
  "ec9d97": "/products/csk_head_screws_ec9d97.png",
  "0a6224": "/products/pan_head_screws_0a6224.png",
  "0a6277": "/products/truss_button_head_screws_0a6277.png",
  "1a5b61": "/products/frame_fixing_screws_1a5b61.jpg",
  "1a5b9d": "/products/wedge_anchors_1a5b9d.png",
  "1a5bd2": "/products/chipboard_screws_1a5bd2.png",
  "1a5c07": "/products/drywall_screws_1a5c07.png",
  "1a5c55": "/products/cutting_wheels_1a5c55.png",
  "1a5c93": "/products/grinding_wheels_1a5c93.png",
  "1a5d2b": "/products/silicon_sealent_1a5d2b.png",
  "1a5d50": "/products/mastic_butyl_tape_1a5d50.png",
  "1a5d6f": "/products/mesh_roll_1a5d6f.png",
  "1a5d8e": "/products/socket_1a5d8e.png",
  "1a5d95": "/products/star_bit_1a5d95.png",
  "1a5de0": "/products/screw_cap_1a5de0.png",
  "1a5dfd": "/products/screw_cap_1a5dfd.png",
  "1a5e3b": "/products/glass_frame_packer_1a5e3b.png",
  "1a5e66": "/products/glass_frame_packer_1a5e66.png",
  "1a5e6d": "/products/casement_packer_1a5e6d.png",
  "1a5e74": "/products/2_profile_packer_1a5e74.png",
  "1a5e7b": "/products/2_5_profile_packer_1a5e7b.png",
  "1a5e82": "/products/3_profile_packer_1a5e82.png",
  "1a5e95": "/products/bump_stopper_1a5e95.png",
  "1a5e9f": "/products/bump_stopper_1a5e9f.png",
  "1a5ea6": "/products/bump_stopper_1a5ea6.png",
  "1a5ead": "/products/louvers_1a5ead.png",
  "1a5eb4": "/products/louvers_1a5eb4.png",
  "1a5ebb": "/products/louvers_1a5ebb.png",
  "1a5ece": "/products/adjustable_louvers_1a5ece.png",
  "1a5ed5": "/products/jump_arrester_1a5ed5.png",
  "1a5edc": "/products/spacer_block_plastic_1a5edc.png",
  "1a5ee3": "/products/spacer_block_rubber_1a5ee3.png",
  "1a5eea": "/products/pvc_bump_stopper_small_1a5eea.png",
  "1a5ef1": "/products/pvc_bump_stopper_big_1a5ef1.png",
  "1a5ef8": "/products/anti_lift_small_1a5ef8.png",
  "1a5f0b": "/products/anti_lift_small_1a5f0b.png",
  "1a5f18": "/products/anti_lift_small_1a5f18.png",
  "1a5f1f": "/products/anti_lift_small_1a5f1f.png",
  "1a5f26": "/products/anti_lift_rehau_1a5f26.png",
  "1a5f2d": "/products/anti_lift_rehau_1a5f2d.png",
  "1a5f34": "/products/anti_lift_lhs_and_rhs_1a5f34.png",
  "1a5f3b": "/products/anti_lift_outer_frame_big_1a5f3b.png",
  "1a5f43": "/products/casement_wedge_big_1a5f43.png",
  "1a5f4a": "/products/cavity_block_1a5f4a.png",
  "1a5f51": "/products/nylon_anchor_1a5f51.png",
  "1a5f64": "/products/mechanical_joint_sliding_1a5f64.png",
  "1a5f9c": "/products/16mm_single_roller_flat_and_groove_1a5f9c.jpg",
  "1a5fd9": "/products/double_wheel_roller_1a5fd9.jpg",
  "1a5fe0": "/products/double_well_udjustable_roller_1a5fe0.jpg",
  "1a5fe7": "/products/mesh_roller_1a5fe7.jpg"
};

async function migrate() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGO_URI);
  const col = mongoose.connection.db.collection('products');

  // Query only _id and name
  const prods = await col.find({}, { projection: { _id: 1, name: 1 } }).toArray();
  console.log(`Analyzing ${prods.length} products in database...`);

  let updatedCount = 0;
  for (const p of prods) {
    const suffix = String(p._id).slice(-6).toLowerCase();
    const cleanImg = productSuffixToImage[suffix] || '';

    // Update if mainImage starts with data:
    const res = await col.updateOne(
      { _id: p._id, mainImage: { $regex: '^data:' } },
      { $set: { mainImage: cleanImg } }
    );
    if (res.modifiedCount > 0) {
      updatedCount++;
      console.log(`✔ Converted legacy base64 to clean cloud/CDN URL for ${p.name} (${suffix}): ${cleanImg}`);
    }

    // Also clean any base64 inside gallery
    await col.updateOne(
      { _id: p._id },
      { $pull: { gallery: { $regex: '^data:' } } }
    );
  }

  console.log(`\nMigration completed! Successfully sanitized ${updatedCount} products with bloated base64.`);
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(e => {
  console.error('Migration error:', e);
  process.exit(1);
});
