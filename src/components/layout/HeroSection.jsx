import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

export default function HeroSection() {
  const canvasRef = useRef(null)
  const wrapRef   = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap   = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')

    const DEEP  = [13, 40, 24]
    const ACC   = [46, 125, 50]
    const AMBER = [180, 83, 9]
    const RED   = [185, 28, 28]
    const BG    = [252, 250, 245]

    const rgba    = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`
    const lerp    = (a, b, t) => a + (b - a) * t
    const easeOut = t => 1 - Math.pow(1 - t, 3)

    let W, H, T = 0, L = {}
    let scanLine = 0, claimAlpha = [], analysisProgress = 0
    let findingAlpha = [], reportAlpha = 0
    let rafId

    const STAGE_DUR   = [3.5, 3.8, 4.2, 4.5, 4.0]
    const STAGE_TOTAL = STAGE_DUR.reduce((a, b) => a + b, 0)

    const CLAIMS = [
      { num: '1',  text: 'Method — distributed inference',  risk: 'HIGH', col: RED   },
      { num: '3',  text: 'Neural module weighted outputs',  risk: 'HIGH', col: RED   },
      { num: '7',  text: 'Training corpus — prior art',     risk: 'MOD',  col: AMBER },
      { num: '12', text: 'Claim-element parser system',     risk: 'LOW',  col: ACC   },
      { num: '15', text: 'Prosecution history estoppel',    risk: 'HIGH', col: RED   },
    ]

    const FINDINGS = [
      { label: 'Written Description Failure', ref: '§ 112(a)',       risk: 'HIGH', col: RED   },
      { label: 'Prosecution Estoppel',        ref: 'Festo Doctrine', risk: 'HIGH', col: RED   },
      { label: 'Prior Art Gap (§ 103)',        ref: 'US 10,945,221', risk: 'MOD',  col: AMBER },
      { label: 'Continuation Window Open',    ref: 'Priority Chain', risk: 'OPP',  col: ACC   },
      { label: 'IPR Exposure Score',          ref: 'PTAB Pattern',   risk: 'HIGH', col: RED   },
    ]

    function rr(x, y, w, h, r) {
      ctx.beginPath()
      ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y)
      ctx.quadraticCurveTo(x+w, y, x+w, y+r); ctx.lineTo(x+w, y+h-r)
      ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h); ctx.lineTo(x+r, y+h)
      ctx.quadraticCurveTo(x, y+h, x, y+h-r); ctx.lineTo(x, y+r)
      ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath()
    }

    function getStage(elapsed) {
      let acc = 0
      for (let i = 0; i < STAGE_DUR.length; i++) {
        acc += STAGE_DUR[i]
        if (elapsed < acc) return { stage: i, local: (elapsed - (acc - STAGE_DUR[i])) / STAGE_DUR[i] }
      }
      return { stage: STAGE_DUR.length - 1, local: 1 }
    }

    /* ── Patent document — font sizes bumped ~18-25% ── */
    function drawPatentDoc(alpha, scanProg, tilt) {
      if (alpha < 0.01) return
      const { x, y, w, h } = L.doc
      const sc = L.scale
      const fx = x + Math.sin(T * 0.35) * 7
      const fy = y + Math.cos(T * 0.28) * 5
      ctx.save(); ctx.globalAlpha = alpha
      ctx.translate(fx, fy); ctx.rotate(tilt * Math.PI / 180)
      ctx.shadowColor = rgba(DEEP, 0.14); ctx.shadowBlur = 28; ctx.shadowOffsetY = 12
      rr(-w/2, -h/2, w, h, 10); ctx.fillStyle = rgba(BG, 0.98); ctx.fill()
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
      rr(-w/2, -h/2, w, h, 10); ctx.strokeStyle = rgba(DEEP, 0.11); ctx.lineWidth = 1; ctx.stroke()
      ctx.beginPath(); ctx.rect(-w/2, -h/2, w, 7)
      ctx.fillStyle = rgba(ACC, 0.75); ctx.fill()

      /* header — was 9px, now 11px */
      ctx.font = `bold ${Math.round(11*sc)}px 'Inconsolata',monospace`
      ctx.fillStyle = rgba(DEEP, 0.40); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('UNITED STATES PATENT', 0, -h/2 + 22*sc)

      /* patent number — was 12px, now 14.5px */
      ctx.font = `600 ${Math.round(14.5*sc)}px 'Libre Baskerville',serif`
      ctx.fillStyle = rgba(DEEP, 0.70)
      ctx.fillText('US 11,234,567 B2', 0, -h/2 + 40*sc)

      ctx.beginPath(); ctx.moveTo(-w/2+14, -h/2+52*sc); ctx.lineTo(w/2-14, -h/2+52*sc)
      ctx.strokeStyle = rgba(DEEP, 0.08); ctx.lineWidth = 0.8; ctx.stroke()

      /* section label — was 9px, now 11px */
      ctx.font = `bold ${Math.round(11*sc)}px 'Inconsolata',monospace`
      ctx.fillStyle = rgba(ACC, 0.75); ctx.textAlign = 'left'
      ctx.fillText('CLAIMS', -w/2+14, -h/2+65*sc)

      const claimRows = [
        [0.30, '1. Method — distributed inference data'],
        [0.38, '   comprising a neural pipeline…'],
        [0.47, '3. Wherein the neural module…'],
        [0.55, '7. Training corpus — prior art refs…'],
        [0.63, '12. System: claim-element parser…'],
        [0.71, '    configured to map elements…'],
        [0.79, '15. Prosecution history estoppel…'],
      ]
      claimRows.forEach(([yf, txt]) => {
        const rowY = -h/2 + h*yf
        const scanned = scanProg > yf
        if (scanned) {
          ctx.beginPath(); ctx.rect(-w/2+10, rowY-6, w-20, 15)
          ctx.fillStyle = rgba(ACC, 0.10); ctx.fill()
          ctx.beginPath(); ctx.rect(-w/2+10, rowY-6, 3, 15)
          ctx.fillStyle = rgba(ACC, 0.60); ctx.fill()
        }
        /* claim rows — was 8.5px, now 10.5px */
        ctx.font = `${scanned ? '500' : '300'} ${Math.round(10.5*sc)}px 'Inconsolata',monospace`
        ctx.fillStyle = rgba(DEEP, scanned ? 0.70 : 0.28)
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
        ctx.fillText(txt, -w/2+17, rowY)
      })
      if (scanProg > 0 && scanProg < 1) {
        const sy = -h/2 + h*scanProg
        const sg = ctx.createLinearGradient(-w/2, sy-12, -w/2, sy+12)
        sg.addColorStop(0, rgba(ACC, 0)); sg.addColorStop(0.5, rgba(ACC, 0.40)); sg.addColorStop(1, rgba(ACC, 0))
        ctx.fillStyle = sg; ctx.fillRect(-w/2, sy-12, w, 24)
        ctx.beginPath(); ctx.moveTo(-w/2+12, sy); ctx.lineTo(w/2-12, sy)
        ctx.strokeStyle = rgba(ACC, 0.60); ctx.lineWidth = 1.1; ctx.stroke()
      }
      /* footer — was 8px, now 10px */
      ctx.font = `${Math.round(10*sc)}px 'Inconsolata',monospace`
      ctx.fillStyle = rgba(DEEP, 0.30); ctx.textAlign = 'center'
      ctx.fillText('Patent Gap AI · USPTO-Connected', 0, h/2-13)
      ctx.restore()
    }

    /* ── Extracted claim chips — font sizes bumped ~20% ── */
    function drawExtractedClaims(alphas) {
      const sc = L.scale
      CLAIMS.forEach((cl, i) => {
        const a = alphas[i]; if (a < 0.02) return
        const angle = -0.55 + i*0.30
        const dist  = (110 + i*8)*sc
        const bx = L.doc.x + Math.cos(angle)*dist + Math.sin(T*0.4+i)*5
        const by = L.doc.y + Math.sin(angle)*dist*0.5 + Math.cos(T*0.3+i)*4
        ctx.save(); ctx.globalAlpha = a
        const chipW = 162*sc, chipH = 38*sc   /* slightly wider for larger text */
        rr(bx-chipW/2, by-chipH/2, chipW, chipH, 6)
        ctx.fillStyle = rgba(BG, 0.97); ctx.fill()
        ctx.strokeStyle = rgba(cl.col, 0.38); ctx.lineWidth = 1; ctx.stroke()
        ctx.beginPath(); ctx.arc(bx-chipW/2+18*sc, by, 11*sc, 0, Math.PI*2)
        ctx.fillStyle = rgba(cl.col, 0.13); ctx.fill()
        ctx.strokeStyle = rgba(cl.col, 0.45); ctx.lineWidth = 0.9; ctx.stroke()

        /* claim number — was 9px, now 11px */
        ctx.font = `bold ${Math.round(11*sc)}px 'Inconsolata',monospace`
        ctx.fillStyle = rgba(cl.col, 0.88); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(cl.num, bx-chipW/2+18*sc, by)

        /* claim text — was 9px, now 11px */
        ctx.font = `300 ${Math.round(11*sc)}px 'Inconsolata',monospace`
        ctx.fillStyle = rgba(DEEP, 0.68); ctx.textAlign = 'left'
        ctx.fillText(cl.text, bx-chipW/2+34*sc, by)

        const rw = 40*sc
        rr(bx+chipW/2-rw-5, by-10*sc, rw, 20*sc, 4)
        ctx.fillStyle = rgba(cl.col, 0.13); ctx.fill()

        /* risk label — was 8px, now 10px */
        ctx.font = `bold ${Math.round(10*sc)}px 'Inconsolata',monospace`
        ctx.fillStyle = rgba(cl.col, 0.92); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(cl.risk, bx+chipW/2-rw/2-5, by)
        ctx.restore()

        ctx.save(); ctx.globalAlpha = a*0.22
        ctx.beginPath(); ctx.moveTo(L.doc.x, L.doc.y); ctx.lineTo(bx, by)
        ctx.strokeStyle = rgba(cl.col, 0.60); ctx.lineWidth = 0.7
        ctx.setLineDash([3, 6]); ctx.stroke(); ctx.setLineDash([])
        ctx.restore()
      })
    }

    /* ── Analysis engine panel — font sizes bumped ~20% ── */
    function drawEngine(alpha, progress) {
      if (alpha < 0.01) return
      const { x, y, w, h } = L.eng, sc = L.scale
      const fx = x + Math.sin(T*0.25)*4
      const fy = y + Math.cos(T*0.20)*3
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(fx, fy)
      rr(-w/2, -h/2, w, h, 12); ctx.fillStyle = rgba(DEEP, 0.95); ctx.fill()
      rr(-w/2, -h/2, w, h, 12); ctx.strokeStyle = rgba(ACC, 0.35); ctx.lineWidth = 1.2; ctx.stroke()

      /* panel title — was 10px, now 12px */
      ctx.font = `bold ${Math.round(12*sc)}px 'Inconsolata',monospace`
      ctx.fillStyle = rgba(ACC, 0.88); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('▶  ANALYSIS ENGINE', 0, -h/2+19*sc)

      ctx.beginPath(); ctx.moveTo(-w/2+12, -h/2+31*sc); ctx.lineTo(w/2-12, -h/2+31*sc)
      ctx.strokeStyle = rgba(ACC, 0.18); ctx.lineWidth = 0.7; ctx.stroke()

      const barY = -h/2+43*sc
      ctx.beginPath(); ctx.rect(-w/2+14, barY, w-28, 8*sc)
      ctx.fillStyle = rgba(BG, 0.09); ctx.fill()
      ctx.beginPath(); ctx.rect(-w/2+14, barY, (w-28)*Math.min(progress,1), 8*sc)
      ctx.fillStyle = rgba(ACC, 0.80); ctx.fill()

      const steps = [
        { label: 'Parsing claim elements',     done: progress > 0.15 },
        { label: 'Cross-ref prosecution file', done: progress > 0.35 },
        { label: 'Infringement mapping',        done: progress > 0.55 },
        { label: 'Prior art correlation',       done: progress > 0.72 },
        { label: 'Risk scoring',                done: progress > 0.88 },
      ]
      steps.forEach((s, i) => {
        const sy = -h/2+66*sc+i*19*sc
        ctx.beginPath(); ctx.arc(-w/2+20*sc, sy, 4*sc, 0, Math.PI*2)
        ctx.fillStyle = rgba(s.done ? ACC : [100,100,100], s.done ? 0.90 : 0.28); ctx.fill()
        if (!s.done && steps[i-1] && steps[i-1].done) {
          const pr = Math.sin(T*4)*0.5+0.5
          ctx.beginPath(); ctx.arc(-w/2+20*sc, sy, 4*sc+pr*6, 0, Math.PI*2)
          ctx.strokeStyle = rgba(ACC, 0.40*(1-pr)); ctx.lineWidth = 1; ctx.stroke()
        }
        /* step labels — was 9px, now 11px */
        ctx.font = `${s.done ? '500' : '300'} ${Math.round(11*sc)}px 'Inconsolata',monospace`
        ctx.fillStyle = rgba(BG, s.done ? 0.88 : 0.42)
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
        ctx.fillText(s.label, -w/2+32*sc, sy)
        if (s.done) {
          ctx.font = `bold ${Math.round(11*sc)}px 'Inconsolata',monospace`
          ctx.fillStyle = rgba(ACC, 0.78); ctx.textAlign = 'right'
          ctx.fillText('✓', w/2-12, sy)
        }
      })

      /* percentage — was 18px, now 22px */
      ctx.font = `bold ${Math.round(22*sc)}px 'Libre Baskerville',serif`
      ctx.fillStyle = rgba(ACC, 0.94); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(Math.round(progress*100) + '%', 0, h/2-22*sc)

      /* sub-label — was 8.5px, now 10.5px */
      ctx.font = `300 ${Math.round(10.5*sc)}px 'Inconsolata',monospace`
      ctx.fillStyle = rgba(BG, 0.42)
      ctx.fillText('CLAIMS ANALYZED', 0, h/2-9*sc)
      ctx.restore()
    }

    /* ── Findings panel — font sizes bumped ~20% ── */
    function drawFindings(alphas) {
      const allA = Math.max(...alphas); if (allA < 0.01) return
      const sc = L.scale, { x, y } = L.eng
      const fx = x + Math.sin(T*0.25)*4
      const fy = y + Math.cos(T*0.20)*3
      const fw = 268*sc, fh = (34 + FINDINGS.length*40)*sc
      ctx.save(); ctx.globalAlpha = allA; ctx.translate(fx, fy)
      rr(-fw/2, -fh/2, fw, 28*sc, 6); ctx.fillStyle = rgba(DEEP, 0.92); ctx.fill()

      /* panel header — was 9.5px, now 11.5px */
      ctx.font = `bold ${Math.round(11.5*sc)}px 'Inconsolata',monospace`
      ctx.fillStyle = rgba(ACC, 0.88); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('INFRINGEMENT ANALYSIS FINDINGS', 0, -fh/2+14*sc)

      FINDINGS.forEach((f, i) => {
        const fa = alphas[i]; if (fa < 0.01) return
        const ry = -fh/2+32*sc+i*40*sc
        ctx.globalAlpha = allA*fa
        rr(-fw/2, ry, fw, 36*sc, 5); ctx.fillStyle = rgba(BG, 0.07); ctx.fill()
        ctx.strokeStyle = rgba(f.col, 0.22); ctx.lineWidth = 0.8; ctx.stroke()
        ctx.beginPath(); ctx.rect(-fw/2, ry, 4, 36*sc)
        ctx.fillStyle = rgba(f.col, 0.75); ctx.fill()

        /* finding label — was 9.5px, now 11.5px */
        ctx.font = `500 ${Math.round(11.5*sc)}px 'Inconsolata',monospace`
        ctx.fillStyle = rgba(BG, 0.88); ctx.textAlign = 'left'; ctx.textBaseline = 'top'
        ctx.fillText(f.label, -fw/2+14, ry+7*sc)

        /* finding ref — was 8px, now 10px */
        ctx.font = `300 ${Math.round(10*sc)}px 'Inconsolata',monospace`
        ctx.fillStyle = rgba(BG, 0.48)
        ctx.fillText(f.ref, -fw/2+14, ry+21*sc)

        const rw = 42*sc
        rr(fw/2-rw-7, ry+8*sc, rw, 19*sc, 4)
        ctx.fillStyle = rgba(f.col, 0.18); ctx.fill()
        ctx.strokeStyle = rgba(f.col, 0.45); ctx.lineWidth = 0.7; ctx.stroke()

        /* risk badge — was 8px, now 10px */
        ctx.font = `bold ${Math.round(10*sc)}px 'Inconsolata',monospace`
        ctx.fillStyle = rgba(f.col, 0.94); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(f.risk, fw/2-rw/2-7, ry+17.5*sc)
      })
      ctx.restore()
    }

    /* ── Report card — font sizes bumped ~20% ── */
    function drawReport(alpha) {
      if (alpha < 0.01) return
      const { x, y, w, h } = L.rep, sc = L.scale
      const fx = x + Math.sin(T*0.30+1)*6
      const fy = y + Math.cos(T*0.24+1)*4
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(fx, fy)
      ctx.shadowColor = rgba(DEEP, 0.13); ctx.shadowBlur = 24; ctx.shadowOffsetY = 10
      rr(-w/2, -h/2, w, h, 10); ctx.fillStyle = rgba(BG, 0.98); ctx.fill()
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
      rr(-w/2, -h/2, w, h, 10); ctx.strokeStyle = rgba(DEEP, 0.10); ctx.lineWidth = 1; ctx.stroke()
      ctx.beginPath(); ctx.rect(-w/2, -h/2, w, 7)
      ctx.fillStyle = rgba(ACC, 0.75); ctx.fill()

      /* report title — was 9px, now 11px */
      ctx.font = `bold ${Math.round(11*sc)}px 'Inconsolata',monospace`
      ctx.fillStyle = rgba(DEEP, 0.44); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('PATENT GAP AI — REPORT', 0, -h/2+22*sc)

      /* subtitle — was 10px, now 12px */
      ctx.font = `500 ${Math.round(12*sc)}px 'Libre Baskerville',serif`
      ctx.fillStyle = rgba(DEEP, 0.64)
      ctx.fillText('US 11,234,567 · Claim Analysis', 0, -h/2+38*sc)

      ctx.beginPath(); ctx.moveTo(-w/2+12, -h/2+50*sc); ctx.lineTo(w/2-12, -h/2+50*sc)
      ctx.strokeStyle = rgba(DEEP, 0.08); ctx.lineWidth = 0.7; ctx.stroke()

      /* stat numbers — was 14px, now 17px */
      const stats = [['5','Gaps Found'],['3','HIGH Risk'],['1','Opportunity']]
      stats.forEach((s, i) => {
        const sx = -w/2+22+i*(w-10)/3
        ctx.font = `bold ${Math.round(17*sc)}px 'Libre Baskerville',serif`
        ctx.fillStyle = rgba(i===1 ? RED : i===2 ? ACC : DEEP, 0.82)
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(s[0], sx, -h/2+66*sc)

        /* stat labels — was 7.5px, now 9.5px */
        ctx.font = `300 ${Math.round(9.5*sc)}px 'Inconsolata',monospace`
        ctx.fillStyle = rgba(DEEP, 0.40); ctx.fillText(s[1], sx, -h/2+80*sc)
      })

      ctx.beginPath(); ctx.moveTo(-w/2+12, -h/2+92*sc); ctx.lineTo(w/2-12, -h/2+92*sc)
      ctx.strokeStyle = rgba(DEEP, 0.06); ctx.lineWidth = 0.6; ctx.stroke()

      const rows = [
        { txt: '§ 112(a) — Written Description', risk: 'HIGH', col: RED   },
        { txt: 'Prosecution Estoppel (Festo)',   risk: 'HIGH', col: RED   },
        { txt: 'Prior Art Gap · § 103',          risk: 'MOD',  col: AMBER },
        { txt: 'Continuation Window Open',       risk: 'OPP',  col: ACC   },
        { txt: 'IPR Exposure · PTAB Pattern',    risk: 'HIGH', col: RED   },
      ]
      rows.forEach((r, i) => {
        const ry = -h/2+102*sc+i*26*sc
        ctx.beginPath(); ctx.rect(-w/2+10, ry, 3, 18*sc)
        ctx.fillStyle = rgba(r.col, 0.75); ctx.fill()

        /* row text — was 8.5px, now 10.5px */
        ctx.font = `300 ${Math.round(10.5*sc)}px 'Inconsolata',monospace`
        ctx.fillStyle = rgba(DEEP, 0.65); ctx.textAlign = 'left'; ctx.textBaseline = 'top'
        ctx.fillText(r.txt, -w/2+17, ry+2)

        /* row risk — was 7.5px, now 9.5px */
        ctx.font = `bold ${Math.round(9.5*sc)}px 'Inconsolata',monospace`
        ctx.fillStyle = rgba(r.col, 0.82); ctx.textAlign = 'right'
        ctx.fillText(r.risk, w/2-10, ry+2)

        ctx.beginPath(); ctx.moveTo(-w/2+10, ry+22*sc); ctx.lineTo(w/2-10, ry+22*sc)
        ctx.strokeStyle = rgba(DEEP, 0.05); ctx.lineWidth = 0.5; ctx.stroke()
      })

      rr(-w/2+18, h/2-34*sc, w-36, 24*sc, 6)
      ctx.fillStyle = rgba(DEEP, 0.92); ctx.fill()

      /* export button text — was 8.5px, now 10.5px */
      ctx.font = `bold ${Math.round(10.5*sc)}px 'Inconsolata',monospace`
      ctx.fillStyle = rgba(BG, 0.84); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('EXPORT  ↓  PDF / DOCX / JSON', 0, h/2-22*sc)
      ctx.restore()
    }

    function drawArrow(x1, y1, x2, y2, alpha, col, pulsed) {
      if (alpha < 0.02) return
      ctx.save(); ctx.globalAlpha = alpha
      const angle = Math.atan2(y2-y1, x2-x1)
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
      ctx.strokeStyle = rgba(col, 0.50); ctx.lineWidth = 1.2
      ctx.setLineDash([4, 7]); ctx.stroke(); ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2-11*Math.cos(angle-0.38), y2-11*Math.sin(angle-0.38))
      ctx.lineTo(x2-11*Math.cos(angle+0.38), y2-11*Math.sin(angle+0.38))
      ctx.closePath(); ctx.fillStyle = rgba(col, 0.60); ctx.fill()
      if (pulsed) {
        const pp = (T*0.55)%1
        const px = x1+(x2-x1)*pp, py = y1+(y2-y1)*pp
        const fade = Math.sin(pp*Math.PI)
        ctx.globalAlpha = alpha*fade*0.95
        const g = ctx.createRadialGradient(px, py, 0, px, py, 8)
        g.addColorStop(0, rgba(col, 0.95)); g.addColorStop(1, rgba(col, 0))
        ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI*2)
        ctx.fillStyle = g; ctx.fill()
        ctx.beginPath(); ctx.arc(px, py, 2.8, 0, Math.PI*2)
        ctx.fillStyle = rgba(col, 1); ctx.fill()
      }
      ctx.restore()
    }

    /* ── Stage label — was 11px, now 13px ── */
    function drawStageLabel(label, alpha) {
      if (alpha < 0.02) return
      const sc = L.scale, x = W*0.50, y = H*0.08
      ctx.save(); ctx.globalAlpha = alpha
      ctx.font = `500 ${Math.round(13*sc)}px 'Inconsolata',monospace`
      const tw = ctx.measureText(label).width + 34
      rr(x-tw/2, y-15, tw, 30, 7)
      ctx.fillStyle = rgba(BG, 0.94); ctx.fill()
      ctx.strokeStyle = rgba(ACC, 0.32); ctx.lineWidth = 0.9; ctx.stroke()
      ctx.beginPath(); ctx.arc(x-tw/2+14, y, 5, 0, Math.PI*2)
      ctx.fillStyle = rgba(ACC, 0.75+Math.sin(T*3)*0.25); ctx.fill()
      ctx.fillStyle = rgba(DEEP, 0.68); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(label, x+7, y)
      ctx.restore()
    }

    /* ── render loop ── */
    function render() {
      ctx.clearRect(0, 0, W, H)
      ctx.save()
      ctx.strokeStyle = rgba(DEEP, 0.06); ctx.lineWidth = 0.5
      for (let gx = 0; gx < W; gx += 34) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke() }
      for (let gy = 0; gy < H; gy += 34) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke() }
      ctx.restore()

      T += 0.016
      const elapsed = T % STAGE_TOTAL
      const { stage, local } = getStage(elapsed)
      const eL = easeOut(local)

      if (stage === 0) {
        const docA = Math.min(1, local*3)
        scanLine = local*0.85
        claimAlpha = CLAIMS.map(()=>0)
        findingAlpha = FINDINGS.map(()=>0)
        analysisProgress = 0; reportAlpha = 0
        drawPatentDoc(docA, scanLine, -3)
        drawStageLabel('① PATENT DOCUMENT INGESTED', docA)
      } else if (stage === 1) {
        scanLine = 0.85 + local*0.15
        drawPatentDoc(1, scanLine, -3+local*1)
        CLAIMS.forEach((_, i) => {
          claimAlpha[i] = Math.min(1, Math.max(0, (local-i*0.12)*4))
        })
        drawExtractedClaims(claimAlpha)
        drawStageLabel('② CLAIMS EXTRACTED & PARSED', Math.min(1,local*4))
      } else if (stage === 2) {
        const docA = lerp(1, 0.40, eL)
        drawPatentDoc(docA, 1, -3+1)
        drawExtractedClaims(CLAIMS.map(()=>lerp(1, 0.25, eL)))
        analysisProgress = eL
        drawEngine(Math.min(1,local*3), analysisProgress)
        drawArrow(L.doc.x+L.doc.w/2, L.doc.y, L.eng.x-L.eng.w/2, L.eng.y, Math.min(1,local*3), ACC, true)
        drawStageLabel('③ RUNNING INFRINGEMENT ANALYSIS', Math.min(1,local*3))
      } else if (stage === 3) {
        drawPatentDoc(0.30, 1, -2)
        drawEngine(lerp(1, 0, eL*2), 1)
        FINDINGS.forEach((_, i) => {
          findingAlpha[i] = Math.min(1, Math.max(0, (local-i*0.13)*3.5))
        })
        drawFindings(findingAlpha)
        drawArrow(L.eng.x+L.eng.w/2, L.eng.y, L.eng.x+L.eng.w/2+40, L.eng.y, Math.min(1,local*3)*0.6, AMBER, true)
        drawStageLabel('④ INFRINGEMENT FINDINGS GENERATED', Math.min(1,local*3))
      } else if (stage === 4) {
        drawPatentDoc(0.18, 1, -2)
        drawFindings(FINDINGS.map(()=>lerp(1, 0.22, eL)))
        reportAlpha = Math.min(1, local*3)
        drawReport(reportAlpha)
        drawArrow(L.eng.x+L.eng.w/2, L.eng.y, L.rep.x-L.rep.w/2, L.rep.y, Math.min(1,local*3)*0.7, ACC, true)
        drawStageLabel('⑤ REPORT COMPILED & READY', Math.min(1,local*3))
      }

      rafId = requestAnimationFrame(render)
    }

    /* ── resize ── */
    function resize() {
      const dpr = window.devicePixelRatio || 1
      W = wrap.clientWidth  || 560
      H = wrap.clientHeight || 540

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      canvas.width  = W * dpr
      canvas.height = H * dpr
      canvas.style.width  = W + 'px'
      canvas.style.height = H + 'px'
      ctx.scale(dpr, dpr)

      const scale = Math.min(1, W / 520)
      const cx = W * 0.50, cy = H * 0.50
      L = {
        scale,
        doc: { x: cx - W*0.28, y: cy, w: Math.round(200*scale), h: Math.round(270*scale) },
        eng: { x: cx,           y: cy, w: Math.round(230*scale), h: Math.round(180*scale) },
        rep: { x: cx + W*0.28,  y: cy, w: Math.round(196*scale), h: Math.round(268*scale) },
      }
      claimAlpha   = CLAIMS.map(() => 0)
      findingAlpha = FINDINGS.map(() => 0)
      scanLine = 0; analysisProgress = 0; reportAlpha = 0
    }

    resize()
    render()

    const ro = new ResizeObserver(() => { resize() })
    ro.observe(wrap)

    const onResize = () => { cancelAnimationFrame(rafId); resize(); render() }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <section className="hero" id="hero">
      <div className="hero-wrap">
        <div className="hero-content">
          <div className="hero-badge">
            <div className="badge-dot" />
            <span>Claim-Level Detection · Attorney-Ready · USPTO-Connected</span>
          </div>
          <h1 className="hero-h1">
          Detect Patent<br />Infringement<br />Before It Reaches<br /><em>Litigation</em>
        </h1>
          <p className="hero-sub">
          Detect and document potential patent infringement using claim-level
          AI analysis on public data — and get attorney-ready findings in minutes,
          not months.
        </p>
          <p className="hero-support">
          Every finding is traceable to a specific claim, a specific source, and a
          specific risk level — structured for immediate legal review.
        </p>
          <div className="hero-btns">
            <Link to="/request-demo" className="btn-green">
              Request Demo
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
            <Link to="/contact" className="btn-ghost">Contact Us</Link>
          </div>
        </div>
        <div className="hero-canvas-wrap" ref={wrapRef}>
          <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>
      </div>
    </section>
  )
}
