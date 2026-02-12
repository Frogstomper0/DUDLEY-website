# Deployment Checklist

## Before You Upload

### 1. Get Your Images Ready
- [ ] Copy your existing `img/` folder from your current site
- [ ] Place it inside the `dudley-redesign/` folder
- [ ] Verify these files exist:
  - `img/dudley-logo.png`
  - `img/ball.png` (or add one if missing)
  - `img/shop-coming.png`
  - `img/smashcut.mp4`
  - `img/about-character.png`
  - `img/bird.png`
  - `img/feats/` folder (all feat images)
  - `img/sponsors/` folder (all sponsor logos)

### 2. Update Content Files
- [ ] Open `games.json` and add real upcoming fixtures
- [ ] Open `feats.json` and verify club highlights are current
- [ ] Open `sponsors.json` and:
  - Add missing sponsor logos (15 have no logo currently)
  - Remove sponsor entries if you don't have logos for them

### 3. Test Locally First
- [ ] Open `preview.html` in browser (shows design without images)
- [ ] Open `index.html` in browser (full site with all features)
- [ ] Test on mobile viewport:
  - Chrome DevTools → Cmd+Opt+I → Toggle Device Toolbar
  - Test iPhone SE, iPhone 12/13, iPad
- [ ] Check these work:
  - Mobile hamburger menu opens/closes
  - Results ticker scrolls smoothly
  - Sponsors marquee loops seamlessly
  - Facebook embed loads (might need to be on live server)

## Deployment

### 4. Upload Files
Upload these files to your web host:
```
dudley-redesign/
├── index.html
├── styles.css
├── app.js
├── feats.json
├── sponsors.json
├── games.json
├── preview.html (optional, for your reference)
├── README.md (optional, for your reference)
└── img/ (your existing images folder)
```

### 5. Verify Data Feeds
After uploading, check browser console (F12) for errors:
- [ ] Ground status feed loading (or failing gracefully)
- [ ] Apify results feed populating ticker + table
- [ ] Games loading from games.json
- [ ] Feats cards displaying
- [ ] Sponsors marquee scrolling
- [ ] No 404 errors for images

### 6. Mobile Testing
Test on REAL devices if possible:
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (Safari)

Check these on mobile:
- [ ] Hero video plays
- [ ] Navigation menu works smoothly
- [ ] Ticker doesn't cause horizontal scroll
- [ ] Tables scroll horizontally if needed
- [ ] Images load properly
- [ ] Buttons/links are tappable (not too small)

## Post-Launch

### 7. Monitor Performance
- [ ] Run Lighthouse audit (Chrome DevTools)
  - Target: 85+ on mobile
  - Target: 95+ on desktop
- [ ] Check load time on 3G connection
- [ ] Optimize images if needed (WebP, compression)

### 8. Content Maintenance
Set reminders to update:
- [ ] `games.json` - Every week during season
- [ ] `feats.json` - After major club events
- [ ] `sponsors.json` - When sponsors change

### 9. Optional Improvements
When you have time:
- [ ] Add real merchandise items (replace placeholder grid)
- [ ] Add contact form functionality
- [ ] Consider adding more GSAP animations
- [ ] Add image lazy loading for better performance
- [ ] Consider adding a blog/news section

## Troubleshooting

### Common Issues

**Images not loading:**
- Check paths are relative (`img/...`) not absolute (`/img/...`)
- Verify image files uploaded correctly
- Check file names match exactly (case-sensitive)

**Data feeds not working:**
- Check browser console for errors
- Verify JSON files are valid (use JSONLint.com)
- Check API URLs haven't changed
- Verify localStorage isn't blocked

**Animations janky on mobile:**
- Check video file size (should be under 5MB)
- Reduce GSAP animation complexity if needed
- Test on lower-end devices

**Facebook embed not showing:**
- Verify Facebook page URL is correct
- Check Facebook Page Plugin settings
- Might need to be on live server (not localhost)

## Support

If something breaks:
1. Check browser console for errors (F12)
2. Verify all files uploaded correctly
3. Test each data feed individually
4. Check the README.md for detailed documentation

## Backup Plan

Keep your old site files backed up until you're 100% confident the new design works. You can always:
- Keep old files in a `/backup/` folder
- Deploy to a subdomain first (`test.dudleymagpies.com.au`)
- Test thoroughly before going live on main domain

---

**When you're ready to go live:**
1. ✅ All checks above completed
2. ✅ Tested on multiple devices
3. ✅ Data feeds verified
4. ✅ Content is current
5. ✅ Backup of old site saved

Then just upload and you're live.

**— Let's go Magpies.**
