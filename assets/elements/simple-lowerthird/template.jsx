<div>
  <div className={['title-container', show ? 'visible' : 'hidden'].join(' ')} style={{ color }}>{title}</div>
  {subtitle && (
  <div className={['subtitle-container', show ? 'visible' : 'hidden'].join(' ')}>{subtitle}</div>
  )}
</div>
